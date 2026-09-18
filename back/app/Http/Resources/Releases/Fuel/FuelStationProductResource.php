<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelStationProductResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'product_id'=>$this->product_id,'minimum_stock'=>$this->minimum_stock,'maximum_stock'=>$this->maximum_stock,'current_stock'=>$this->current_stock,'status'=>$this->status];} }
