<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelMaintenancePlanResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fleet_id'=>$this->fleet_id,'name'=>$this->name,'marking_type'=>$this->marking_type,'interval_value'=>$this->interval_value,'base_meter_value'=>$this->base_meter_value,'status'=>$this->status];} }
