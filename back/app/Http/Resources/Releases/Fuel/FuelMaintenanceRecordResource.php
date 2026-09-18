<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelMaintenanceRecordResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fleet_id'=>$this->fleet_id,'maintenance_plan_id'=>$this->maintenance_plan_id,'maintenance_date'=>$this->maintenance_date,'marking_type'=>$this->marking_type,'meter_value'=>$this->meter_value,'next_meter_value'=>$this->next_meter_value,'cost'=>$this->cost,'description'=>$this->description];} }
