<?php

namespace App\Http\Resources\Api\Registrations\Property\Areas;

use Illuminate\Http\Resources\Json\JsonResource;

class CycleByVarietyResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'cycle' => $this->cycle,
        ];
    }
}
