<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\ContractTransfer;
use App\Services\Releases\Grain\ContractService;
use Illuminate\Http\Request;

class ContractTransferController extends Controller
{
    public function __construct(private readonly ContractService $service) {}
    public function index() { return ContractTransfer::query()->latest()->paginate(25); }
    public function store(Request $request) { $data = $request->validate(['grain_balance_id' => ['required', 'exists:grain_balances,id'], 'destination_contract_id' => ['required', 'exists:grain_sale_contracts,id'], 'weight' => ['required', 'numeric', 'gt:0'], 'reason' => ['nullable', 'string']]); return response()->json($this->service->transferToContract($data, $request->user()->id), 201); }
    public function betweenContracts(Request $request) { $data = $request->validate(['grain_balance_id' => ['required', 'exists:grain_balances,id'], 'origin_contract_id' => ['required', 'different:destination_contract_id', 'exists:grain_sale_contracts,id'], 'destination_contract_id' => ['required', 'exists:grain_sale_contracts,id'], 'weight' => ['required', 'numeric', 'gt:0'], 'reason' => ['required', 'string'], 'authorization_request_id' => ['required', 'exists:grain_authorization_requests,id']]); return response()->json($this->service->betweenContracts($data, $request->user()->id), 201); }
    public function reverse(Request $request, ContractTransfer $transfer) { $data = $request->validate(['authorization_request_id' => ['required', 'exists:grain_authorization_requests,id'], 'reason' => ['required', 'string']]); return $this->service->reverse($transfer, $data, $request->user()->id); }
}
