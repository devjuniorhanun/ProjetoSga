<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelGaugeReadingRequest;
use App\Http\Resources\Releases\Fuel\FuelGaugeReadingResource;
use App\Models\Releases\Fuel\FuelTankGaugeReading;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
class FuelGaugeReadingController extends Controller { public function __construct(private FuelManagementService $service){} public function index(Request $request){return FuelGaugeReadingResource::collection(FuelTankGaugeReading::latest('reading_at')->paginate($request->integer('per_page',20)));} public function store(FuelGaugeReadingRequest $request){$item=$this->service->createGaugeReading($request->validated());return (new FuelGaugeReadingResource($item))->response()->setStatusCode(201);} }
