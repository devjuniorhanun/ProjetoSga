<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelTransferRequest;
use App\Http\Resources\Releases\Fuel\FuelTransferResource;
use App\Models\Releases\Fuel\FuelTransfer;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
class FuelTransferController extends Controller { public function __construct(private FuelManagementService $service){} public function index(Request $request){return FuelTransferResource::collection(FuelTransfer::latest('id')->paginate($request->integer('per_page',20)));} public function store(FuelTransferRequest $request){$item=FuelTransfer::create([...$request->validated(),'responsible_id'=>auth()->id()]);return (new FuelTransferResource($item))->response()->setStatusCode(201);} public function confirm(FuelTransfer $transfer){return new FuelTransferResource($this->service->confirmTransfer($transfer));} }
