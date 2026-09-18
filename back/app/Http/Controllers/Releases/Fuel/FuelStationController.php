<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelStationRequest;
use App\Http\Resources\Releases\Fuel\FuelStationResource;
use App\Models\Releases\Fuel\FuelStation;
use Illuminate\Http\Request;
class FuelStationController extends Controller {
 public function index(Request $request) { return FuelStationResource::collection(FuelStation::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelStationRequest $request) { $item=FuelStation::create($request->validated()); return (new FuelStationResource($item))->response()->setStatusCode(201); }
 public function show(FuelStation $station) { return new FuelStationResource($station); }
 public function update(FuelStationRequest $request,FuelStation $station) { $station->update($request->validated()); return new FuelStationResource($station->fresh()); }
 public function destroy(FuelStation $station) { $station->delete(); return response()->noContent(); }
}
