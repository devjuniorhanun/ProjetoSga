<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelEntryRequest;
use App\Http\Resources\Releases\Fuel\FuelEntryResource;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
use App\Models\Releases\Fuel\FuelEntry;
class FuelEntryController extends Controller { public function __construct(private FuelManagementService $service){} public function index(Request $request){return FuelEntryResource::collection(FuelEntry::latest('id')->paginate($request->integer('per_page',20)));} public function store(FuelEntryRequest $request){$item=$this->service->createEntry($request->validated());return (new FuelEntryResource($item))->response()->setStatusCode(201);} }
