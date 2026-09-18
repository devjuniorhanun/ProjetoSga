<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelStationResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'name'=>$this->name,'code'=>$this->code,'station_type'=>$this->station_type,'status'=>$this->status,'description'=>$this->description,'tanks'=>FuelTankResource::collection($this->whenLoaded('tanks')),'products'=>FuelStationProductResource::collection($this->whenLoaded('products')),'registradoras'=>FuelRegistradoraResource::collection($this->whenLoaded('registradoras'))];} }
