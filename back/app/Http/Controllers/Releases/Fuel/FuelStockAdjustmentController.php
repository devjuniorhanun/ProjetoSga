<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelStockAdjustmentRequest;
use App\Services\Releases\Fuel\FuelStockService;
use App\Http\Resources\Releases\Fuel\FuelStockMovementResource;
class FuelStockAdjustmentController extends Controller {
    public function __construct(private FuelStockService $service) {}
    public function store(FuelStockAdjustmentRequest $request) {
        $data=$request->validated(); $data['responsible_id']=auth()->id();
        return new FuelStockMovementResource($this->service->registerAdjustment($data));
    }
}
