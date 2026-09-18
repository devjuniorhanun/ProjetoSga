<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelRegistradoraRequest;
use App\Http\Resources\Releases\Fuel\FuelRegistradoraResource;
use App\Models\Releases\Fuel\FuelRegistradora;
use Illuminate\Http\Request;
class FuelRegistradoraController extends Controller {
 public function index(Request $request) { return FuelRegistradoraResource::collection(FuelRegistradora::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelRegistradoraRequest $request) { $item=FuelRegistradora::create($request->validated()); return (new FuelRegistradoraResource($item))->response()->setStatusCode(201); }
 public function show(FuelRegistradora $registradora) { return new FuelRegistradoraResource($registradora); }
 public function update(FuelRegistradoraRequest $request,FuelRegistradora $registradora) { $registradora->update($request->validated()); return new FuelRegistradoraResource($registradora->fresh()); }
 public function destroy(FuelRegistradora $registradora) { $registradora->delete(); return response()->noContent(); }
}
