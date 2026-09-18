<?php

// Define o namespace do resource de safras.
namespace App\Http\Resources\Registrations\Harvest;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

// Define a representação JSON de uma safra.
class CropResource extends JsonResource
{
    // Converte o model para o contrato da API.
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'agricultural_year_id' => $this->agricultural_year_id,
            'agricultural_year_name' => $this->whenLoaded(
                'agriculturalYear',
                fn () => $this->agriculturalYear?->name,
            ),
            'name' => $this->name,
            'opening_date' => $this->opening_date?->format('Y-m-d'),
            'closing_date' => $this->closing_date?->format('Y-m-d'),
            'status' => $this->status,
            'culture_ids' => $this->whenLoaded(
                'cultures',
                fn () => $this->cultures->pluck('id')->values()->all(),
            ),
            'cultures' => CultureResource::collection(
                $this->whenLoaded('cultures'),
            ),
        ];
    }
}
