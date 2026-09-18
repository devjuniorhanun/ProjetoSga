<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelMeterReadingRequest;
use App\Http\Resources\Releases\Fuel\FuelMeterReadingResource;
use App\Models\Releases\Fuel\FleetMeterReading;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
class FuelMeterReadingController extends Controller { public function __construct(private FuelManagementService $service){} public function index(Request $request){return FuelMeterReadingResource::collection(FleetMeterReading::latest('reading_date')->paginate($request->integer('per_page',20)));} public function store(FuelMeterReadingRequest $request){$item=$this->service->createMeterReading($request->validated());return (new FuelMeterReadingResource($item))->response()->setStatusCode(201);} }
