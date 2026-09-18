<?php

// Define o namespace do resource de culturas.
namespace App\Http\Resources\Registrations\Harvest;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Define a representação JSON de uma cultura.
class CultureResource extends JsonResource
{
    // Converte o model para o contrato da API.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
