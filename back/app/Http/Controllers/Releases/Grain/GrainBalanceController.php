<?php

namespace App\Http\Controllers\Releases\Grain;

use App\Http\Controllers\Controller;
use App\Models\Releases\Grain\GrainBalance;
use App\Models\Releases\Grain\StockMovement;
use Illuminate\Http\Request;

class GrainBalanceController extends Controller
{
    public function index(Request $request) {
        return GrainBalance::query()->when($request->producer_id, fn ($q, $v) => $q->where('producer_id', $v))->when($request->culture_id, fn ($q, $v) => $q->where('culture_id', $v))->when($request->crop_id, fn ($q, $v) => $q->where('crop_id', $v))->paginate(50)->through(fn (GrainBalance $balance) => [...$balance->toArray(), 'usable_physical_balance' => max(0, (float) $balance->physical_balance - (float) $balance->pending_impurity_weight), 'available_for_contract' => $balance->availableForContract()]);
    }
    public function movements(Request $request) { return StockMovement::query()->when($request->grain_balance_id, fn ($q, $v) => $q->where('grain_balance_id', $v))->when($request->movement_type, fn ($q, $v) => $q->where('movement_type', $v))->latest('occurred_at')->paginate(50); }
}
