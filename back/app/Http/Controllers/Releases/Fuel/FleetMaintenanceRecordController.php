<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelMaintenanceRecordRequest;
use App\Http\Resources\Releases\Fuel\FuelMaintenanceRecordResource;
use App\Models\Releases\Fuel\FleetMaintenanceRecord;
use Illuminate\Http\Request;
class FleetMaintenanceRecordController extends Controller {
 public function index(Request $request) { return FuelMaintenanceRecordResource::collection(FleetMaintenanceRecord::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelMaintenanceRecordRequest $request) { $item=FleetMaintenanceRecord::create($request->validated()); return (new FuelMaintenanceRecordResource($item))->response()->setStatusCode(201); }
 public function show(FleetMaintenanceRecord $maintenanceRecord) { return new FuelMaintenanceRecordResource($maintenanceRecord); }
 public function update(FuelMaintenanceRecordRequest $request,FleetMaintenanceRecord $maintenanceRecord) { $maintenanceRecord->update($request->validated()); return new FuelMaintenanceRecordResource($maintenanceRecord->fresh()); }
 public function destroy(FleetMaintenanceRecord $maintenanceRecord) { $maintenanceRecord->delete(); return response()->noContent(); }
}
