<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\GrainBalance;
use App\Services\Releases\Grain\AuthorizationService;
use App\Services\Releases\Grain\GrainBalanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    public function __construct(private readonly GrainBalanceService $balances, private readonly AuthorizationService $authorizations) {}
    public function store(Request $request) {
        $data = $request->validate(['grain_balance_id' => ['required', 'exists:grain_balances,id'], 'physical_quantity' => ['required', 'numeric', 'not_in:0'], 'commercial_quantity' => ['required', 'numeric'], 'reason' => ['required', 'string'], 'authorization_request_id' => ['required', 'exists:grain_authorization_requests,id']]);
        return DB::transaction(function () use ($request, $data) { $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'STOCK_ADJUSTMENT', $data['grain_balance_id']); $balance = GrainBalance::query()->lockForUpdate()->findOrFail($data['grain_balance_id']); $movement = $this->balances->move($balance, ['movement_type' => 'STOCK_ADJUSTMENT', 'physical_quantity' => $data['physical_quantity'], 'commercial_quantity' => $data['commercial_quantity'], 'reason' => $data['reason'], 'created_by' => $request->user()->id]); $this->authorizations->consume($authorization); return response()->json($movement, 201); });
    }
}
