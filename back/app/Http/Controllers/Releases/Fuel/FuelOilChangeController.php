<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelOilChangeRequest;
use App\Http\Resources\Releases\Fuel\FuelOilChangeResource;
use App\Models\Releases\Fuel\FleetOilChange as FuelOilChange;
use Illuminate\Http\Request;
class FuelOilChangeController extends Controller {
 public function index(Request $request) { return FuelOilChangeResource::collection(FuelOilChange::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelOilChangeRequest $request) { $item=FuelOilChange::create($request->validated()); return (new FuelOilChangeResource($item))->response()->setStatusCode(201); }
 public function show(FuelOilChange $oilChange) { return new FuelOilChangeResource($oilChange); }
 public function update(FuelOilChangeRequest $request,FuelOilChange $oilChange) { $oilChange->update($request->validated()); return new FuelOilChangeResource($oilChange->fresh()); }
 public function destroy(FuelOilChange $oilChange) { $oilChange->delete(); return response()->noContent(); }
}
