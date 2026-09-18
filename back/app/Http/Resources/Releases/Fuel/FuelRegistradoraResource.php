<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelRegistradoraResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'product_id'=>$this->product_id,'name'=>$this->name,'initial_reading'=>$this->initial_reading,'status'=>$this->status];} }
