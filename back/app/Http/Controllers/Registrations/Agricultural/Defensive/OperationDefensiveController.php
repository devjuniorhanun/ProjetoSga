<?php
namespace App\Http\Controllers\Registrations\Agricultural\Defensive;
use App\Http\Controllers\Controller;
use App\Http\Requests\Registrations\Agricultural\Defensive\OperationDefensiveRequest;
use App\Http\Resources\Registrations\Agricultural\Defensive\OperationDefensiveResource;
use App\Models\Registrations\Agricultural\Defensive\OperationDefensive;
use App\Services\Registrations\Agricultural\Defensive\OperationDefensiveService;
class OperationDefensiveController extends Controller { public function __construct(private OperationDefensiveService $service){} public function index(){return OperationDefensiveResource::collection($this->service->list());} public function store(OperationDefensiveRequest $request){$item=$this->service->create($request->validated());return (new OperationDefensiveResource($item))->response()->setStatusCode(201);} public function show(OperationDefensive $operationDefensive){return new OperationDefensiveResource($operationDefensive);} public function update(OperationDefensiveRequest $request,OperationDefensive $operationDefensive){return new OperationDefensiveResource($this->service->update($operationDefensive,$request->validated()));} public function destroy(OperationDefensive $operationDefensive){$this->service->delete($operationDefensive);return response()->noContent();} }
