<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelTankRequest;
use App\Http\Resources\Releases\Fuel\FuelTankResource;
use App\Models\Releases\Fuel\FuelTank;
use Illuminate\Http\Request;
class FuelTankController extends Controller {
 public function index(Request $request) { return FuelTankResource::collection(FuelTank::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelTankRequest $request) { $item=FuelTank::create($request->validated()); return (new FuelTankResource($item))->response()->setStatusCode(201); }
 public function show(FuelTank $tank) { return new FuelTankResource($tank); }
 public function update(FuelTankRequest $request,FuelTank $tank) { $tank->update($request->validated()); return new FuelTankResource($tank->fresh()); }
 public function destroy(FuelTank $tank) { $tank->delete(); return response()->noContent(); }
}
