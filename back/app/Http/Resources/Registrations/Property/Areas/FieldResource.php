<?php

namespace App\Http\Resources\Registrations\Property\Areas;

use Illuminate\Http\Resources\Json\JsonResource;

class FieldResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            // Expõe o campo farm_id.
            'farm_id' => $this->farm_id,
            'farm_name' => $this->farm->name,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo area.
            'area' => $this->area,
            // Expõe o campo block.
            'block' => $this->block,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
