<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelMeterReadingResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'fleet_id'=>$this->fleet_id,'reading_date'=>$this->reading_date,'marking_type'=>$this->marking_type,'initial_value'=>$this->initial_value,'final_value'=>$this->final_value,'worked_value'=>$this->worked_value,'observation'=>$this->observation];} }
