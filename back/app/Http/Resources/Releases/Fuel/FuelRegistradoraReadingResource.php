<?php
namespace App\Http\Resources\Releases\Fuel;
use Illuminate\Http\Resources\Json\JsonResource;
class FuelRegistradoraReadingResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id'=>$this->id,'id'=>$this->id,'fuel_registradora_id'=>$this->fuel_registradora_id,'reading_date'=>$this->reading_date,'start_reading'=>$this->start_reading,'end_reading'=>$this->end_reading,'quantity'=>$this->quantity,'observation'=>$this->observation];
    }
}
