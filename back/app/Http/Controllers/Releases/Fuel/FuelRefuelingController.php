<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelRefuelingRequest;
use App\Http\Resources\Releases\Fuel\FuelRefuelingResource;
use App\Models\Releases\Fuel\FuelRefueling;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
class FuelRefuelingController extends Controller { public function __construct(private FuelManagementService $service){} public function index(Request $request){return FuelRefuelingResource::collection(FuelRefueling::latest('id')->paginate($request->integer('per_page',20)));} public function store(FuelRefuelingRequest $request){$item=$this->service->createRefueling($request->validated());return (new FuelRefuelingResource($item))->response()->setStatusCode(201);} }
