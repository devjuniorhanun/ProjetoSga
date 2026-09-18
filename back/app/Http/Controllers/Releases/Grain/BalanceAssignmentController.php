<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\BalanceAssignment;
use App\Services\Releases\Grain\BalanceAssignmentService;
use Illuminate\Http\Request;

class BalanceAssignmentController extends Controller
{
    public function __construct(private readonly BalanceAssignmentService $service) {}
    public function index() { return BalanceAssignment::query()->latest()->paginate(25); }
    public function store(Request $request) { $data = $request->validate(['origin_grain_balance_id' => ['required', 'exists:grain_balances,id'], 'destination_producer_id' => ['required', 'exists:producers,id'], 'destination_farm_state_registration_id' => ['required', 'exists:farm_state_registrations,id'], 'destination_ownership_type' => ['required', 'in:OW,TP'], 'weight' => ['required', 'numeric', 'gt:0'], 'reason' => ['required', 'string'], 'authorization_request_id' => ['required', 'exists:grain_authorization_requests,id']]); return response()->json($this->service->create($data, $request->user()->id), 201); }
}
