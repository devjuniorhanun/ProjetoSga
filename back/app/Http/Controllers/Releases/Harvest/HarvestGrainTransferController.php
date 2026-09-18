<?php

namespace App\Http\Controllers\Releases\Harvest;

use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Harvest\HarvestGrainTransferRequest;
use App\Http\Resources\Releases\Harvest\HarvestGrainTransferResource;
use App\Models\Releases\Harvest\HarvestGrainTransfer;
use App\Services\Releases\Harvest\HarvestGrainTransferService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HarvestGrainTransferController extends Controller
{
    public function __construct(private HarvestGrainTransferService $service) {}

    public function index(Request $request)
    {
        $filters = $request->validate([
            'crop_id' => ['nullable', 'integer'], 'producer_id' => ['nullable', 'integer'],
            'owner_id' => ['nullable', 'integer'], 'warehouse_id' => ['nullable', 'integer'],
            'culture_id' => ['nullable', 'integer'], 'status' => ['nullable', 'in:A,I'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);
        return HarvestGrainTransferResource::collection($this->service->list($filters));
    }

    public function eligibleOwners()
    {
        return DB::table('owners')->where('payment_type', 'T')->where('status', 'A')->whereNull('deleted_at')
            ->select('id', 'corporate_name', 'fantasy_name', 'payment_type')->orderBy('corporate_name')->get();
    }

    public function availableBalance(Request $request)
    {
        $data = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'producer_id' => ['required', 'integer', 'exists:producers,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'culture_id' => ['required', 'integer', 'exists:cultures,id'],
        ]);
        $kg = $this->service->availableKg($data);

        return response()->json(['available_kg' => $kg, 'available_bags' => round($kg / 60, 3)]);
    }

    public function store(HarvestGrainTransferRequest $request)
    {
        return (new HarvestGrainTransferResource($this->service->save($request->validated(), null, $request->user()?->id)))
            ->response()->setStatusCode(201);
    }

    public function show(HarvestGrainTransfer $grainTransfer)
    {
        return new HarvestGrainTransferResource($this->service->find($grainTransfer));
    }

    public function update(HarvestGrainTransferRequest $request, HarvestGrainTransfer $grainTransfer)
    {
        return new HarvestGrainTransferResource($this->service->save($request->validated(), $grainTransfer, $request->user()?->id));
    }

    public function destroy(HarvestGrainTransfer $grainTransfer)
    {
        $this->service->delete($grainTransfer);
        return response()->noContent();
    }
}
