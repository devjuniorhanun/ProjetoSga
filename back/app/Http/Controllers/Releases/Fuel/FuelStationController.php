<?php
namespace App\Http\Controllers\Releases\Fuel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Releases\Fuel\FuelStationRequest;
use App\Http\Resources\Releases\Fuel\FuelStationResource;
use App\Models\Releases\Fuel\FuelStation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
class FuelStationController extends Controller {
 public function index(Request $request) { $this->ensurePhysicalStockLocations(); return FuelStationResource::collection(FuelStation::query()->latest('id')->paginate($request->integer('per_page',20))); }
 public function store(FuelStationRequest $request) { $item=DB::transaction(function()use($request){$station=FuelStation::create($request->validated());$this->syncStockLocation($station);return $station;});return (new FuelStationResource($item))->response()->setStatusCode(201); }
 public function show(FuelStation $station) { return new FuelStationResource($station); }
 public function update(FuelStationRequest $request,FuelStation $station) { $station->update($request->validated());$this->syncStockLocation($station);return new FuelStationResource($station->fresh()); }
 public function destroy(FuelStation $station) { DB::table('stock_locations')->where('fuel_station_id',$station->id)->update(['status'=>'I','updated_at'=>now()]);$station->delete();return response()->noContent(); }
 private function ensurePhysicalStockLocations():void{FuelStation::query()->where('station_type','F')->where('status','A')->get()->each(fn(FuelStation $station)=>$this->syncStockLocation($station));}
 private function syncStockLocation(FuelStation $station):void{if($station->station_type==='F'){$location=DB::table('stock_locations')->where('fuel_station_id',$station->id);$data=['name'=>'Estoque - '.$station->name,'code'=>'FUEL-STATION-'.$station->id,'location_type'=>'FUEL_STATION','status'=>$station->status,'updated_at'=>now()];$location->exists()?$location->update($data):DB::table('stock_locations')->insert([...$data,'fuel_station_id'=>$station->id,'created_at'=>now()]);}else{DB::table('stock_locations')->where('fuel_station_id',$station->id)->update(['status'=>'I','updated_at'=>now()]);}}
}
