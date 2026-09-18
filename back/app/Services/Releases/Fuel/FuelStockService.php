<?php
namespace App\Services\Releases\Fuel;
use App\Models\Releases\Fuel\FuelStockMovement;
use App\Models\Releases\Fuel\FuelStationProduct;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Services\Releases\Inventory\ProductStockService;

class FuelStockService {
    public function __construct(private readonly ProductStockService $unifiedStock) {}
    public function moveStock(int $stationId,int $productId,float $quantity,string $movementType,string $direction,?int $tankId=null,?string $referenceType=null,?int $referenceId=null,?float $unitCost=null,?int $responsibleId=null,?string $observation=null): FuelStockMovement {
        if ($quantity <= 0) throw ValidationException::withMessages(['quantity'=>'A quantidade deve ser maior que zero.']);
        if (!in_array($direction,['I','O'],true)) throw ValidationException::withMessages(['direction'=>'Direção de estoque inválida.']);
        $stock=FuelStationProduct::where('fuel_station_id',$stationId)->where('product_id',$productId)->lockForUpdate()->first();
        if (!$stock) throw ValidationException::withMessages(['product_id'=>'O produto não está habilitado neste posto.']);
        $before=(float)$stock->current_stock;
        $after=$direction==='I' ? $before+$quantity : $before-$quantity;
        if ($after < 0) throw ValidationException::withMessages(['quantity'=>'Estoque insuficiente no posto de origem.']);
        $stock->update(['current_stock'=>$after]);
        $movement=FuelStockMovement::create(['fuel_station_id'=>$stationId,'product_id'=>$productId,'fuel_tank_id'=>$tankId,'movement_type'=>$movementType,'direction'=>$direction,'quantity'=>$quantity,'stock_before'=>$before,'stock_after'=>$after,'unit_cost'=>$unitCost,'total_cost'=>$unitCost===null?null:$unitCost*$quantity,'reference_type'=>$referenceType,'reference_id'=>$referenceId,'responsible_id'=>$responsibleId,'observation'=>$observation]);
        $location=DB::table('stock_locations')->where('location_type','FUEL_STATION')->where('fuel_station_id',$stationId)->whereNull('deleted_at')->first();
        if(!$location){$station=DB::table('fuel_stations')->find($stationId);$locationId=DB::table('stock_locations')->insertGetId(['name'=>'Estoque - '.$station->name,'code'=>'FUEL-STATION-'.$stationId,'location_type'=>'FUEL_STATION','fuel_station_id'=>$stationId,'status'=>'A','created_at'=>now(),'updated_at'=>now()]);}else{$locationId=$location->id;}
        $payload=['product_id'=>$productId,'stock_location_id'=>$locationId,'quantity'=>$quantity,'unit_value'=>$unitCost??0,'movement_type'=>'FUEL_'.$movementType,'source_type'=>FuelStockMovement::class,'source_id'=>$movement->id,'created_by'=>$responsibleId,'reason'=>$observation];
        $direction==='I'?$this->unifiedStock->entry($payload):$this->unifiedStock->output($payload);
        return $movement;
    }
    public function registerEntry(array $data): FuelStockMovement { return DB::transaction(function() use($data){ return $this->moveStock($data['fuel_station_id'],$data['product_id'],(float)$data['quantity'],'E','I',$data['fuel_tank_id']??null,'fuel_entry',$data['entry_id']??null,$data['unit_price']??null,$data['responsible_id']??null,$data['observation']??null); }); }
    public function registerRefueling(array $data): FuelStockMovement { return DB::transaction(function() use($data){ return $this->moveStock($data['fuel_station_id'],$data['product_id'],(float)$data['quantity'],'S','O',null,'fuel_refueling',$data['refueling_id']??null,$data['unit_price']??null,$data['responsible_id']??null,$data['observation']??null); }); }
    public function registerReturn(array $data): FuelStockMovement { return DB::transaction(function() use($data){ return $this->moveStock($data['fuel_station_id'],$data['product_id'],(float)$data['quantity'],'D','I',$data['fuel_tank_id']??null,'return',$data['reference_id']??null,$data['unit_price']??null,$data['responsible_id']??null,$data['observation']??null); }); }
    public function registerAdjustment(array $data): FuelStockMovement { return DB::transaction(function() use($data){ return $this->moveStock($data['fuel_station_id'],$data['product_id'],(float)$data['quantity'],'A',$data['direction'],$data['fuel_tank_id']??null,'adjustment',$data['reference_id']??null,$data['unit_price']??null,$data['responsible_id']??null,$data['observation']??null); }); }
}
