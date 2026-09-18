<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelEntryResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'fuel_tank_id'=>$this->fuel_tank_id,'product_id'=>$this->product_id,'supplier_id'=>$this->supplier_id,'entry_date'=>$this->entry_date,'quantity'=>$this->quantity,'unit_price'=>$this->unit_price,'total_value'=>$this->total_value,'invoice_number'=>$this->invoice_number,'status'=>$this->status,'observation'=>$this->observation];} }
