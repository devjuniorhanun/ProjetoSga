<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelTankResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_station_id'=>$this->fuel_station_id,'name'=>$this->name,'code'=>$this->code,'capacity'=>$this->capacity,'status'=>$this->status,'description'=>$this->description];} }
