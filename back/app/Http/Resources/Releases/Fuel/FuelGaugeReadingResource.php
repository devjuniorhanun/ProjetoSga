<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelGaugeReadingResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_tank_id'=>$this->fuel_tank_id,'reading_at'=>$this->reading_at,'centimeters'=>$this->centimeters,'liters'=>$this->liters,'observation'=>$this->observation];} }
