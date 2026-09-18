<?php

// Define o namespace do resource administrativo.
namespace App\Http\Resources\Registrations\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Define a representação JSON da configuração.
class ConfigResource extends JsonResource
{
    // Converte o model para o contrato da API.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'producer_name' => $this->producer_name,
            'property_name' => $this->property_name,
            'producer_color' => $this->producer_color,
            'property_color' => $this->property_color,
            'logo_path' => $this->logo_path,
            'logo_url' => $this->logo_path ? asset('storage/'.$this->logo_path) : null,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
