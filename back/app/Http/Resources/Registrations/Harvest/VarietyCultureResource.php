<?php

// Define o namespace do resource de variedades.
namespace App\Http\Resources\Registrations\Harvest;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Define a representação JSON de uma variedade.
class VarietyCultureResource extends JsonResource
{
    // Converte o model para a resposta da API.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'culture_id' => $this->culture_id,
            'culture_name' => $this->whenLoaded(
                'culture',
                fn () => $this->culture?->name,
            ),
            'name' => $this->name,
            'technology' => $this->technology,
            'cycle' => $this->cycle,
            'flowering_days' => $this->flowering_days,
            'status' => $this->status,
        ];
    }
}
