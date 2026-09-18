<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Services\Releases\Fuel\FuelManagementService;
use Illuminate\Http\Request;
class FuelDashboardController extends Controller { public function __construct(private FuelManagementService $service){} public function reconciliation(Request $request){$request->validate(['fuel_station_id'=>'required|integer','product_id'=>'required|integer','date'=>'nullable|date']);return response()->json($this->service->reconciliation($request->integer('fuel_station_id'),$request->integer('product_id'),$request->input('date')));} public function consumption(Request $request){$request->validate(['fleet_id'=>'required|integer','start'=>'required|date','end'=>'required|date|after_or_equal:start']);return response()->json($this->service->consumption($request->integer('fleet_id'),$request->input('start'),$request->input('end')));} }
