<?php

namespace App\Http\Resources\Registrations\Harvest\Property;

use Illuminate\Http\Resources\Json\JsonResource;

class ProducerResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            // Expõe o campo owner_id.
            'owner_id' => $this->owner_id,
            'owner_name' => $this->owner->corporate_name,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
