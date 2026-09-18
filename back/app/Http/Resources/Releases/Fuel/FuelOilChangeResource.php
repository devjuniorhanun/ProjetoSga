<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelOilChangeResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fleet_id'=>$this->fleet_id,'product_id'=>$this->product_id,'change_date'=>$this->change_date,'marking_type'=>$this->marking_type,'meter_value'=>$this->meter_value,'quantity'=>$this->quantity,'next_meter_value'=>$this->next_meter_value,'observation'=>$this->observation];} }
