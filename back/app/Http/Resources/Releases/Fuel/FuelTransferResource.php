<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelTransferResource extends JsonResource { public function toArray($request): array{return ['id'=>$this->id,'id'=>$this->id,'source_station_id'=>$this->source_station_id,'source_tank_id'=>$this->source_tank_id,'destination_station_id'=>$this->destination_station_id,'destination_tank_id'=>$this->destination_tank_id,'product_id'=>$this->product_id,'transfer_date'=>$this->transfer_date,'quantity'=>$this->quantity,'status'=>$this->status,'document_number'=>$this->document_number,'observation'=>$this->observation];} }
