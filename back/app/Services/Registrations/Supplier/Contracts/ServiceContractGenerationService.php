<?php

namespace App\Services\Registrations\Supplier\Contracts;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ServiceContractGenerationService
{
    public function supplierOptions(string $type): array
    {
        $typeName = $type === 'TRANSPORT' ? 'TRANSPORTADOR' : 'COLHEDOR';

        return DB::table('suppliers as s')
            ->join('supplier_type_supplier as sts', 'sts.supplier_id', '=', 's.id')
            ->join('type_suppliers as ts', 'ts.id', '=', 'sts.type_supplier_id')
            ->whereRaw('UPPER(ts.name) = ?', [$typeName])
            ->where('s.status', 'A')->whereNull('s.deleted_at')
            ->where('ts.status', 'A')->whereNull('ts.deleted_at')
            ->orderBy('s.corporate_reason')
            ->get(['s.id', 's.corporate_reason', 's.fantasy_name', 's.cpf_cnpj'])
            ->all();
    }

    public function participants(string $type, int $supplierId): array
    {
        $this->activeSupplierOfType($supplierId, $type);

        $query = $type === 'TRANSPORT'
            ? DB::table('drivers')->where('supplier_id', $supplierId)
                ->where('status', 'A')->whereNull('deleted_at')->orderBy('name')
                ->get(['id', 'name', 'code', 'plate'])
            : DB::table('lanyards')->where('supplier_id', $supplierId)
                ->where('status', 'A')->whereNull('deleted_at')->orderBy('front')
                ->get(['id', 'front', 'machine_quantity', 'number_feet']);

        return [
            'participants' => $query->all(),
            'bank_accounts' => DB::table('bank_suppliers')->where('supplier_id', $supplierId)
                ->where('status', 'A')->whereNull('deleted_at')->orderBy('id')->get()->all(),
        ];
    }

    public function preview(string $type, array $data): array
    {
        $supplier = $this->activeSupplierOfType((int) $data['supplier_id'], $type);
        $participants = collect($this->participants($type, (int) $supplier->id)['participants']);
        $producers = $this->cropProducers((int) $data['crop_id']);
        $errors = [];
        $banks = DB::table('bank_suppliers')->where('supplier_id', $supplier->id)
            ->where('status', 'A')->whereNull('deleted_at')->orderBy('id')->get();
        $bank = null;
        if (!empty($data['bank_supplier_id'])) {
            $bank = $banks->firstWhere('id', (int) $data['bank_supplier_id']);
            if (!$bank) $errors[] = ['field' => 'bank_supplier_id', 'message' => 'A conta escolhida não está ativa ou não pertence ao fornecedor.'];
        } elseif ($banks->count() === 1) {
            $bank = $banks->first();
        } elseif ($banks->count() > 1) {
            $errors[] = ['field' => 'bank_supplier_id', 'message' => 'Escolha uma das contas bancárias ativas do fornecedor.'];
        }

        if ($participants->isEmpty()) $errors[] = ['field' => 'participants', 'message' => 'O fornecedor não possui participantes ativos.'];
        if ($producers->isEmpty()) $errors[] = ['field' => 'crop_id', 'message' => 'A safra não possui produtores vinculados por talhões.'];

        return [
            'can_generate' => $errors === [],
            'contract_type' => $type,
            'contracts_count' => $producers->count(),
            'supplier' => $supplier,
            'participants' => $participants->values(),
            'producers' => $producers->values(),
            'bank_account' => $bank,
            'bank_accounts' => $banks,
            'bank_selection_required' => $banks->count() > 1 && !$bank,
            'warnings' => $banks->isEmpty() ? ['O fornecedor não possui conta bancária ativa. O contrato será gerado sem dados bancários.'] : [],
            'errors' => $errors,
        ];
    }

    public function generate(string $type, array $data): array
    {
        return DB::transaction(function () use ($type, $data): array {
            $preview = $this->preview($type, $data);
            if (! $preview['can_generate']) {
                throw ValidationException::withMessages(['contract' => collect($preview['errors'])->pluck('message')->all()]);
            }

            $batch = (string) Str::orderedUuid();
            $supplier = (object) $preview['supplier'];
            $bank = $preview['bank_account'] ? (array) $preview['bank_account'] : null;
            $participants = collect($preview['participants'])->map(fn ($item) => (array) $item)->values()->all();
            $created = [];

            foreach ($preview['producers'] as $producerValue) {
                $producer = (array) $producerValue;
                $snapshot = [
                    'template' => $type === 'TRANSPORT' ? 'TRANSPORT_CONTRACT_V1' : 'HARVEST_CONTRACT_V1',
                    'crop_id' => (int) $data['crop_id'],
                    'producer' => $producer,
                    'supplier' => (array) $supplier,
                    'participants' => $participants,
                    'bank_account' => $bank,
                    'conditions' => $data,
                ];

                $table = $type === 'TRANSPORT' ? 'drivers_contracts' : 'lanyards_contracts';
                $prefix = $type === 'TRANSPORT' ? 'TRN' : 'COL';
                $number = $prefix.'-'.date('Y').'-'.strtoupper(substr(str_replace('-', '', (string) Str::uuid()), 0, 10));
                $common = [
                    'contract_number' => $number, 'generation_batch' => $batch,
                    'crop_id' => $data['crop_id'], 'producer_id' => $producer['id'],
                    'supplier_id' => $supplier->id, 'bank_supplier_id' => $bank['id'] ?? null,
                    'opening_date' => $data['opening_date'], 'closing_date' => $data['closing_date'],
                    'producer_snapshot' => json_encode($producer, JSON_UNESCAPED_UNICODE),
                    'supplier_snapshot' => json_encode((array) $supplier, JSON_UNESCAPED_UNICODE),
                    'participants_snapshot' => json_encode($participants, JSON_UNESCAPED_UNICODE),
                    'bank_snapshot' => $bank ? json_encode($bank, JSON_UNESCAPED_UNICODE) : null,
                    'contract_snapshot' => json_encode($snapshot, JSON_UNESCAPED_UNICODE),
                    'generated_at' => now(), 'status' => 'A', 'created_at' => now(), 'updated_at' => now(),
                ];

                $specific = $type === 'TRANSPORT'
                    ? ['shipping_cost' => $data['shipping_cost'], 'calculation_basis' => 'GROSS_BAGS',
                        'bag_weight' => 60, 'service_hours' => $data['service_hours'] ?? null,
                        'extra_service_description' => $data['extra_service_description'] ?? null,
                        'observations' => $data['observations'] ?? null]
                    : ['body' => null, 'remuneration_percentage' => $data['remuneration_percentage'],
                        'calculation_basis' => 'LIQUID_BAGS', 'bag_weight' => 60,
                        'fuel_supplied_by' => $data['fuel_supplied_by'] ?? 'CONTRACTING_PARTY',
                        'meal_allowance_description' => $data['meal_allowance_description'] ?? null,
                        'observations' => $data['observations'] ?? null];

                $id = DB::table($table)->insertGetId(array_merge($common, $specific));
                $linkTable = $type === 'TRANSPORT' ? 'driver_contracts' : 'lanyard_contracts_links';
                $contractColumn = $type === 'TRANSPORT' ? 'drivers_contract_id' : 'lanyard_contract_id';
                $participantColumn = $type === 'TRANSPORT' ? 'driver_id' : 'lanyard_id';
                foreach ($participants as $participant) {
                    DB::table($linkTable)->insert([$contractColumn => $id, $participantColumn => $participant['id'],
                        'status' => 'A', 'created_at' => now(), 'updated_at' => now()]);
                }
                $created[] = ['id' => $id, 'contract_number' => $number, 'contract_type' => $type, 'producer' => $producer];
            }

            return ['generation_batch' => $batch, 'contracts_count' => count($created), 'contracts' => $created];
        });
    }

    public function history(array $filters): array
    {
        $rows = collect();
        foreach ([['drivers_contracts', 'TRANSPORT'], ['lanyards_contracts', 'HARVEST']] as [$table, $type]) {
            if (($filters['contract_type'] ?? null) && $filters['contract_type'] !== $type) continue;
            $query = DB::table($table.' as c')->join('crops as crop', 'crop.id', '=', 'c.crop_id')
                ->join('suppliers as supplier', 'supplier.id', '=', 'c.supplier_id')
                ->join('producers as producer', 'producer.id', '=', 'c.producer_id')
                ->join('owners as owner', 'owner.id', '=', 'producer.owner_id')->whereNull('c.deleted_at');
            foreach (['crop_id', 'producer_id', 'supplier_id', 'status'] as $field) {
                if (isset($filters[$field]) && $filters[$field] !== '') $query->where('c.'.$field, $filters[$field]);
            }
            if (!empty($filters['contract_number'])) $query->where('c.contract_number', 'like', '%'.$filters['contract_number'].'%');
            $items = $query->get(['c.id','c.contract_number','c.generation_batch','c.crop_id','crop.name as crop_name',
                'c.producer_id','owner.corporate_name as producer_name','c.supplier_id','supplier.corporate_reason as supplier_name',
                'c.opening_date','c.closing_date','c.status','c.generated_at','c.pdf_path','c.pdf_hash'])
                ->map(fn ($item) => array_merge((array) $item, ['contract_type' => $type]));
            $rows = $rows->concat($items);
        }
        return $rows->sortByDesc('generated_at')->values()->all();
    }

    public function pdfData(string $type, int $id): object
    {
        $table = $type === 'TRANSPORT' ? 'drivers_contracts' : 'lanyards_contracts';
        $contract = (array) DB::table($table)->where('id', $id)->whereNull('deleted_at')->firstOrFail();
        foreach (['producer_snapshot','supplier_snapshot','participants_snapshot','bank_snapshot','contract_snapshot'] as $field) {
            $contract[$field] = isset($contract[$field]) ? json_decode($contract[$field], true) : null;
        }
        return (object) $contract;
    }

    public function savePdf(string $type, int $id, UploadedFile $file): object
    {
        $table = $type === 'TRANSPORT' ? 'drivers_contracts' : 'lanyards_contracts';
        $contract = DB::table($table)->where('id', $id)->whereNull('deleted_at')->firstOrFail();
        if ($contract->pdf_path) Storage::disk('local')->delete($contract->pdf_path);
        $hash = hash_file('sha256', $file->getRealPath());
        $path = $file->store('contracts/'.$type, 'local');
        DB::table($table)->where('id', $id)->update(['pdf_path' => $path,
            'pdf_hash' => $hash, 'pdf_generated_at' => now(), 'updated_at' => now()]);
        return DB::table($table)->where('id', $id)->first();
    }

    public function pdfPath(string $type, int $id): string
    {
        $table = $type === 'TRANSPORT' ? 'drivers_contracts' : 'lanyards_contracts';
        $contract = DB::table($table)->where('id', $id)->whereNull('deleted_at')->firstOrFail();
        if (! $contract->pdf_path || ! Storage::disk('local')->exists($contract->pdf_path)) {
            abort(404, 'O PDF deste contrato ainda não foi gerado.');
        }

        return $contract->pdf_path;
    }

    private function activeSupplierOfType(int $id, string $type): object
    {
        $name = $type === 'TRANSPORT' ? 'TRANSPORTADOR' : 'COLHEDOR';
        $supplier = DB::table('suppliers as s')->join('supplier_type_supplier as sts', 'sts.supplier_id', '=', 's.id')
            ->join('type_suppliers as ts', 'ts.id', '=', 'sts.type_supplier_id')
            ->where('s.id', $id)->where('s.status', 'A')->whereNull('s.deleted_at')
            ->whereRaw('UPPER(ts.name) = ?', [$name])->where('ts.status', 'A')->whereNull('ts.deleted_at')
            ->first(['s.id','s.corporate_reason','s.fantasy_name','s.type','s.cpf_cnpj','s.rg_ie']);
        if (!$supplier) throw ValidationException::withMessages(['supplier_id' => ["Informe um fornecedor ativo do tipo {$name}."]]);
        return $supplier;
    }

    private function cropProducers(int $cropId)
    {
        return DB::table('plot_fields as pf')->join('fields as f', 'f.id', '=', 'pf.field_id')
            ->join('farms as farm', 'farm.id', '=', 'f.farm_id')->join('producers as p', 'p.id', '=', 'farm.producer_id')
            ->join('owners as o', 'o.id', '=', 'p.owner_id')->where('pf.crop_id', $cropId)
            ->where('pf.status', 'A')->whereNull('pf.deleted_at')->where('f.status', 'A')->whereNull('f.deleted_at')
            ->where('farm.status', 'A')->whereNull('farm.deleted_at')->where('p.status', 'A')->whereNull('p.deleted_at')
            ->distinct()->orderBy('o.corporate_name')->get(['p.id','o.corporate_name','o.fantasy_name','o.payment_type']);
    }
}
