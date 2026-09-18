<?php

namespace App\Http\Resources\Registrations\Property\Areas;

use Illuminate\Http\Resources\Json\JsonResource;

class FarmResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            // Expõe o campo owner_id.
            'owner_id' => $this->owner_id,
            'owner_name' => $this->owner->corporate_name,
            // Expõe o campo producer_id.
            'producer_id' => $this->producer_id,
            'producer_name' => $this->producer->owner->corporate_name,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo total_area.
            'total_area' => $this->total_area,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
