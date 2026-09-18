<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\SaleContract;
use App\Services\Releases\Grain\AuthorizationService;
use App\Services\Releases\Grain\ContractService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaleContractController extends Controller
{
    public function __construct(private readonly ContractService $service, private readonly AuthorizationService $authorizations) {}
    public function index(Request $request) { return SaleContract::query()->when($request->buyer_id, fn ($q, $v) => $q->where('buyer_id', $v))->when($request->status, fn ($q, $v) => $q->where('status', $v))->oldest()->paginate(25); }
    public function show(SaleContract $contract): SaleContract { return $contract; }
    public function buyers() { return DB::table('suppliers')->join('supplier_type_supplier', 'supplier_type_supplier.supplier_id', '=', 'suppliers.id')->join('type_suppliers', 'type_suppliers.id', '=', 'supplier_type_supplier.type_supplier_id')->where('type_suppliers.code', 'BUYER')->where('suppliers.status', 'A')->select('suppliers.*')->distinct()->orderBy('corporate_reason')->get(); }
    public function store(Request $request) { $data = $request->validate($this->rules()); return response()->json($this->service->create($data, $request->user()->id), 201); }
    public function update(Request $request, SaleContract $contract) { $data = $request->validate([...$this->rules(true), 'authorization_request_id' => ['required', 'exists:grain_authorization_requests,id']]); $authorization = $data['authorization_request_id']; unset($data['authorization_request_id']); return $this->service->update($contract, $data, $authorization); }
    public function changeStatus(Request $request, SaleContract $contract) {
        $data = $request->validate(['status' => ['required', Rule::in(['OPEN', 'SUSPENDED', 'CANCELED'])], 'authorization_request_id' => ['required', 'exists:grain_authorization_requests,id']]);
        return DB::transaction(function () use ($contract, $data) { $contract = SaleContract::query()->lockForUpdate()->findOrFail($contract->id); $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'CHANGE_CONTRACT_STATUS', $contract->id); $this->authorizations->assertPayloadMatches($authorization, ['status' => $data['status']]); $contract->update(['status' => $data['status']]); $this->authorizations->consume($authorization); return $contract->refresh(); });
    }
    private function rules(bool $update = false): array { $r = $update ? 'sometimes' : 'required'; return ['contract_number' => [$r, 'string', 'max:100'], 'buyer_id' => [$r, 'exists:suppliers,id'], 'producer_id' => [$r, 'exists:producers,id'], 'farm_state_registration_id' => [$r, 'exists:farm_state_registrations,id'], 'crop_id' => [$r, 'exists:crops,id'], 'culture_id' => [$r, 'exists:cultures,id'], 'ownership_type' => [$r, Rule::in(['OW', 'TP'])], 'contract_date' => ['nullable', 'date'], 'start_date' => ['nullable', 'date'], 'expiration_date' => ['nullable', 'date'], 'contracted_weight' => [$r, 'numeric', 'gt:0'], 'tolerance_percentage' => ['sometimes', 'numeric', 'between:0,100'], 'status' => ['sometimes', Rule::in(['DRAFT', 'OPEN'])], 'notes' => ['nullable', 'string']]; }
}
