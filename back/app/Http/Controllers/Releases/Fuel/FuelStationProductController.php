<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelStationProductRequest;
use App\Http\Resources\Releases\Fuel\FuelStationProductResource;
use App\Models\Releases\Fuel\FuelStationProduct;
use Illuminate\Http\Request;
class FuelStationProductController extends Controller {
 public function index(Request $request) { return FuelStationProductResource::collection(FuelStationProduct::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelStationProductRequest $request) { $item=FuelStationProduct::create($request->validated()); return (new FuelStationProductResource($item))->response()->setStatusCode(201); }
 public function show(FuelStationProduct $station_product) { return new FuelStationProductResource($station_product); }
 public function update(FuelStationProductRequest $request,FuelStationProduct $station_product) { $station_product->update($request->validated()); return new FuelStationProductResource($station_product->fresh()); }
 public function destroy(FuelStationProduct $station_product) { $station_product->delete(); return response()->noContent(); }
}
