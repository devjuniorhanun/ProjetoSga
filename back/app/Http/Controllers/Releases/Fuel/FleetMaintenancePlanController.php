<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelMaintenancePlanRequest;
use App\Http\Resources\Releases\Fuel\FuelMaintenancePlanResource;
use App\Models\Releases\Fuel\FleetMaintenancePlan;
use Illuminate\Http\Request;
class FleetMaintenancePlanController extends Controller {
 public function index(Request $request) { return FuelMaintenancePlanResource::collection(FleetMaintenancePlan::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelMaintenancePlanRequest $request) { $item=FleetMaintenancePlan::create($request->validated()); return (new FuelMaintenancePlanResource($item))->response()->setStatusCode(201); }
 public function show(FleetMaintenancePlan $maintenancePlan) { return new FuelMaintenancePlanResource($maintenancePlan); }
 public function update(FuelMaintenancePlanRequest $request,FleetMaintenancePlan $maintenancePlan) { $maintenancePlan->update($request->validated()); return new FuelMaintenancePlanResource($maintenancePlan->fresh()); }
 public function destroy(FleetMaintenancePlan $maintenancePlan) { $maintenancePlan->delete(); return response()->noContent(); }
}
