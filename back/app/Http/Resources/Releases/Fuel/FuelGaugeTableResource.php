<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelGaugeTableResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fuel_tank_id'=>$this->fuel_tank_id,'centimeters'=>$this->centimeters,'liters'=>$this->liters];} }
