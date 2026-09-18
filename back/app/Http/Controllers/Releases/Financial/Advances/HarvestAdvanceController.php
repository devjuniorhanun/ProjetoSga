<?php

namespace App\Http\Controllers\Releases\Financial\Advances;

use App\Http\Controllers\Controller;
use App\Models\Releases\Financial\PayAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class HarvestAdvanceController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'advance_type' => ['nullable', Rule::in(['HARVESTER', 'TRANSPORTER'])],
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'producer_id' => ['nullable', 'integer', 'exists:producers,id'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);
        $entryType = match ($data['advance_type'] ?? null) {
            'HARVESTER' => PayAccount::ENTRY_HARVESTER_ADVANCE,
            'TRANSPORTER' => PayAccount::ENTRY_TRANSPORTER_ADVANCE,
            default => null,
        };

        return PayAccount::query()
            ->with(['supplier', 'producer', 'administrativeCenter', 'costCenter', 'typePayAccount', 'crop'])
            ->whereIn('entry_type', [PayAccount::ENTRY_HARVESTER_ADVANCE, PayAccount::ENTRY_TRANSPORTER_ADVANCE])
            ->when($entryType, fn ($query) => $query->where('entry_type', $entryType))
            ->when($data['crop_id'] ?? null, fn ($query, $id) => $query->where('crop_id', $id))
            ->when($data['supplier_id'] ?? null, fn ($query, $id) => $query->where('supplier_id', $id))
            ->when($data['producer_id'] ?? null, fn ($query, $id) => $query->where('producer_id', $id))
            ->latest('document_date')->latest('id')
            ->paginate($data['per_page'] ?? 25)->withQueryString();
    }

    public function harvesters(Request $request)
    {
        $crop = $this->activeCrop($request->integer('crop_id'));

        return DB::table('lanyard_contracts_links as link')
            ->join('lanyards_contracts as contract', 'contract.id', '=', 'link.lanyard_contract_id')
            ->join('lanyards as lanyard', 'lanyard.id', '=', 'link.lanyard_id')
            ->join('suppliers as supplier', 'supplier.id', '=', 'lanyard.supplier_id')
            ->where('contract.crop_id', $crop->id)
            ->where('contract.status', 'A')->where('link.status', 'A')
            ->where('lanyard.status', 'A')->where('supplier.status', 'A')
            ->whereNull('contract.deleted_at')->whereNull('link.deleted_at')
            ->whereNull('lanyard.deleted_at')->whereNull('supplier.deleted_at')
            ->select('supplier.id as supplier_id', 'supplier.corporate_reason as supplier_name')
            ->distinct()->orderBy('supplier.corporate_reason')->get();
    }

    public function transporterSuppliers(Request $request)
    {
        $crop = $this->activeCrop($request->integer('crop_id'));
        $paid = DB::table('pay_accounts')
            ->select('crop_id', 'supplier_id', DB::raw('SUM(value) as paid_value'))
            ->where('entry_type', PayAccount::ENTRY_TRANSPORTER_ADVANCE)
            ->whereNull('deleted_at')->groupBy('crop_id', 'supplier_id');

        return DB::table('harvest_releases as release')
            ->join('drivers as driver', 'driver.id', '=', 'release.driver_id')
            ->join('suppliers as supplier', 'supplier.id', '=', 'driver.supplier_id')
            ->leftJoinSub($paid, 'paid', function ($join): void {
                $join->on('paid.crop_id', '=', 'release.crop_id')
                    ->on('paid.supplier_id', '=', 'supplier.id');
            })
            ->where('release.crop_id', $crop->id)->where('release.status', 'A')
            ->where('supplier.status', 'A')->whereNull('release.deleted_at')->whereNull('supplier.deleted_at')
            ->whereExists(function ($query) use ($crop): void {
                $query->selectRaw('1')->from('driver_contracts as link')
                    ->join('drivers_contracts as contract', 'contract.id', '=', 'link.drivers_contract_id')
                    ->whereColumn('link.driver_id', 'release.driver_id')
                    ->where('link.status', 'A')->where('contract.crop_id', $crop->id)
                    ->where('contract.status', 'A')->whereNull('link.deleted_at')->whereNull('contract.deleted_at');
            })
            ->groupBy('supplier.id', 'supplier.corporate_reason', 'paid.paid_value')
            ->select(
                'supplier.id as supplier_id', 'supplier.corporate_reason as supplier_name',
                DB::raw('ROUND(SUM(release.gross_bags), 2) as total_gross_bags'),
                DB::raw('ROUND(SUM(release.shipping_value), 2) as total_shipping_value'),
                DB::raw('ROUND(COALESCE(paid.paid_value, 0), 2) as paid_value'),
                DB::raw('ROUND(SUM(release.shipping_value) - COALESCE(paid.paid_value, 0), 2) as open_value'),
            )->orderBy('supplier.corporate_reason')->get();
    }

    public function driverSuppliers(Request $request)
    {
        return $this->transporterSuppliers($request);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'advance_type' => ['required', Rule::in(['HARVESTER', 'TRANSPORTER'])],
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'producer_id' => ['required', 'integer', 'exists:producers,id'],
            'administrative_center_id' => ['required', 'integer', 'exists:administrative_centers,id'],
            'type_pay_account_id' => ['required', 'integer', 'exists:type_pay_accounts,id'],
            'document_date' => ['required', 'date_format:Y-m-d'],
            'due_date' => ['required', 'date_format:Y-m-d'],
            'document_number' => ['required', 'string', 'max:255'],
            'value' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'observation' => ['nullable', 'string'],
        ]);

        return DB::transaction(function () use ($data) {
            $this->activeCrop((int) $data['crop_id']);
            $this->validateCommonRelations($data);
            $data['advance_type'] === 'HARVESTER'
                ? $this->validateHarvesterSupplier($data)
                : $this->validateTransporterAdvance($data);

            $costName = $data['advance_type'] === 'HARVESTER' ? 'ADIANTAMENTO COLHEITA' : 'FRETE';
            $costCenterId = DB::table('cost_centers')->whereRaw('UPPER(name) = ?', [$costName])
                ->where('status', 'A')->whereNull('deleted_at')->value('id');
            if (!$costCenterId) {
                throw ValidationException::withMessages(['cost_center_id' => ["Centro de custo {$costName} não encontrado ou inativo."]]);
            }

            $entryType = $data['advance_type'] === 'HARVESTER'
                ? PayAccount::ENTRY_HARVESTER_ADVANCE : PayAccount::ENTRY_TRANSPORTER_ADVANCE;
            $label = $data['advance_type'] === 'HARVESTER'
                ? 'Adiantamento de colheita' : 'Adiantamento de transportador';
            $description = $label;
            if (!empty($data['observation'])) {
                $description .= ' - ' . $data['observation'];
            }

            $payAccount = PayAccount::create([
                'crop_id' => $data['crop_id'], 'administrative_center_id' => $data['administrative_center_id'],
                'cost_center_id' => $costCenterId, 'supplier_id' => $data['supplier_id'],
                'producer_id' => $data['producer_id'], 'type_pay_account_id' => $data['type_pay_account_id'],
                'document_number' => $data['document_number'], 'document_date' => $data['document_date'],
                'due_date' => $data['due_date'], 'description' => $description, 'value' => $data['value'],
                'accounted_for' => 'N', 'status' => 'RI', 'entry_type' => $entryType,
            ]);

            return response()->json($payAccount->load([
                'supplier', 'producer', 'administrativeCenter', 'costCenter', 'typePayAccount', 'crop',
            ]), 201);
        });
    }

    private function validateCommonRelations(array $data): void
    {
        $supplier = DB::table('suppliers')->where('id', $data['supplier_id'])
            ->where('status', 'A')->whereNull('deleted_at')->lockForUpdate()->exists();
        if (!$supplier) {
            throw ValidationException::withMessages(['supplier_id' => ['Informe um fornecedor ativo.']]);
        }
        $center = DB::table('administrative_centers')->where('id', $data['administrative_center_id'])
            ->where('producer_id', $data['producer_id'])->where('status', 'A')->whereNull('deleted_at')->exists();
        if (!$center) {
            throw ValidationException::withMessages(['administrative_center_id' => ['Selecione um centro administrativo ativo do produtor pagador.']]);
        }
        $paymentType = DB::table('type_pay_accounts')->where('id', $data['type_pay_account_id'])
            ->where('status', 'A')->whereNull('deleted_at')->exists();
        if (!$paymentType) {
            throw ValidationException::withMessages(['type_pay_account_id' => ['Informe um tipo de pagamento ativo.']]);
        }
    }

    private function validateHarvesterSupplier(array $data): void
    {
        $eligible = DB::table('lanyard_contracts_links as link')
            ->join('lanyards_contracts as contract', 'contract.id', '=', 'link.lanyard_contract_id')
            ->join('lanyards as lanyard', 'lanyard.id', '=', 'link.lanyard_id')
            ->where('contract.crop_id', $data['crop_id'])->where('lanyard.supplier_id', $data['supplier_id'])
            ->where('contract.status', 'A')->where('link.status', 'A')->where('lanyard.status', 'A')
            ->whereNull('contract.deleted_at')->whereNull('link.deleted_at')->whereNull('lanyard.deleted_at')->exists();
        if (!$eligible) {
            throw ValidationException::withMessages(['supplier_id' => ['O fornecedor não possui colhedor ativo com contrato nesta safra.']]);
        }
    }

    private function validateTransporterAdvance(array $data): void
    {
        $totalFreight = (float) DB::table('harvest_releases as release')
            ->join('drivers as driver', 'driver.id', '=', 'release.driver_id')
            ->where('release.crop_id', $data['crop_id'])->where('driver.supplier_id', $data['supplier_id'])
            ->where('release.status', 'A')->whereNull('release.deleted_at')->lockForUpdate()->sum('release.shipping_value');
        $totalPaid = (float) PayAccount::query()->where('crop_id', $data['crop_id'])
            ->where('supplier_id', $data['supplier_id'])
            ->where('entry_type', PayAccount::ENTRY_TRANSPORTER_ADVANCE)->lockForUpdate()->sum('value');
        $open = round($totalFreight - $totalPaid, 2);
        if ($open <= 0 || $open + 0.001 < (float) $data['value']) {
            throw ValidationException::withMessages([
                'value' => ['O valor informado ultrapassa o saldo de frete disponível de R$ ' . number_format(max($open, 0), 2, ',', '.') . '.'],
            ]);
        }
    }

    private function activeCrop(int $id): object
    {
        $crop = DB::table('crops')->where('id', $id)->where('status', 'A')->whereNull('deleted_at')->first();
        if (!$crop) {
            throw ValidationException::withMessages(['crop_id' => ['Informe uma safra ativa.']]);
        }
        return $crop;
    }
}
