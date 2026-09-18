<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelRefuelingResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'product_id'=>$this->product_id,'fleet_id'=>$this->fleet_id,'operator_id'=>$this->operator_id,'fuel_registradora_id'=>$this->fuel_registradora_id,'refueled_at'=>$this->refueled_at,'quantity'=>$this->quantity,'unit_price'=>$this->unit_price,'total_value'=>$this->total_value,'marking_type'=>$this->marking_type,'meter_value'=>$this->meter_value,'observation'=>$this->observation];} }
