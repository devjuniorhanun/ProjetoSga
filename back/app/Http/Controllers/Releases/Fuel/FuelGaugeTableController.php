<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelGaugeTableRequest;
use App\Http\Resources\Releases\Fuel\FuelGaugeTableResource;
use App\Models\Releases\Fuel\FuelTankGaugeTable as FuelGaugeTable;
use Illuminate\Http\Request;
class FuelGaugeTableController extends Controller {
 public function index(Request $request) { return FuelGaugeTableResource::collection(FuelGaugeTable::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelGaugeTableRequest $request) { $item=FuelGaugeTable::create($request->validated()); return (new FuelGaugeTableResource($item))->response()->setStatusCode(201); }
 public function show(FuelGaugeTable $gaugeTable) { return new FuelGaugeTableResource($gaugeTable); }
 public function update(FuelGaugeTableRequest $request,FuelGaugeTable $gaugeTable) { $gaugeTable->update($request->validated()); return new FuelGaugeTableResource($gaugeTable->fresh()); }
 public function destroy(FuelGaugeTable $gaugeTable) { $gaugeTable->delete(); return response()->noContent(); }
}
