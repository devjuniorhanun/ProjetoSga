<?php

// Define o namespace do resource de anos agrícolas.
namespace App\Http\Resources\Registrations\Harvest;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Define a representação JSON de um ano agrícola.
class AgriculturalYearResource extends JsonResource
{
    // Converte o model em dados próprios da API.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'opening_date' => $this->opening_date?->format('Y-m-d'),
            'closing_date' => $this->closing_date?->format('Y-m-d'),
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
