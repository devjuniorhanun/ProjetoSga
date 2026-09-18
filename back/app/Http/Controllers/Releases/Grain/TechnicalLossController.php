<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\TechnicalLoss;
use App\Models\Releases\Grain\GrainBalance;
use App\Services\Releases\Grain\AuthorizationService;
use App\Services\Releases\Grain\GrainBalanceService;
use App\Services\Releases\Grain\TechnicalLossService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TechnicalLossController extends Controller
{
    public function __construct(private readonly TechnicalLossService $service, private readonly AuthorizationService $authorizations, private readonly GrainBalanceService $balances) {}
    public function index(Request $request) { return TechnicalLoss::query()->when($request->reference_year, fn ($q, $v) => $q->where('reference_year', $v))->when($request->reference_month, fn ($q, $v) => $q->where('reference_month', $v))->latest()->paginate(25); }
    public function process(Request $request) { return ['processed' => $this->service->processDue($request->user()->id)]; }
    public function reverse(Request $request, TechnicalLoss $technicalLoss) {
        $data = $request->validate(['authorization_request_id' => ['required', 'exists:grain_authorization_requests,id'], 'reason' => ['required', 'string']]);
        return DB::transaction(function () use ($request, $technicalLoss, $data) {
            $loss = TechnicalLoss::query()->lockForUpdate()->findOrFail($technicalLoss->id);
            abort_if($loss->reversed_at, 422, 'Quebra já estornada.');
            $authorization = $this->authorizations->assertApproved($data['authorization_request_id'], 'REVERSE_TECHNICAL_LOSS', $loss->id);
            $balance = GrainBalance::query()->lockForUpdate()->findOrFail($loss->grain_balance_id);
            $this->balances->move($balance, ['movement_type' => 'REVERSAL', 'physical_quantity' => $loss->applied_loss, 'commercial_quantity' => $loss->applied_loss, 'source_type' => TechnicalLoss::class, 'source_id' => $loss->id, 'reason' => $data['reason'], 'created_by' => $request->user()->id]);
            $loss->update(['reversed_by' => $request->user()->id, 'reversed_at' => now(), 'authorization_request_id' => $authorization->id]);
            $this->authorizations->consume($authorization);
            return $loss->refresh();
        });
    }
}
