<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelStockMovementResource extends JsonResource {
    public function toArray($request): array { return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'product_id'=>$this->product_id,'fuel_tank_id'=>$this->fuel_tank_id,'movement_type'=>$this->movement_type,'direction'=>$this->direction,'quantity'=>$this->quantity,'stock_before'=>$this->stock_before,'stock_after'=>$this->stock_after,'unit_cost'=>$this->unit_cost,'total_cost'=>$this->total_cost,'reference_type'=>$this->reference_type,'reference_id'=>$this->reference_id,'observation'=>$this->observation,'created_at'=>$this->created_at]; }
}
