<?php

namespace App\Http\Resources\Registrations\Property\Areas;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe MatrixFreightResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class MatrixFreightResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo crop_id.
            'crop_id' => $this->crop_id,
            'crop_name' => $this->crop->name,
            // Expõe o campo block.
            'block' => $this->block,
            // Expõe o campo route.
            'route' => $this->route,
            // Expõe o campo price.
            'price' => $this->resource->getRawOriginal('price'),
            'effective_from' => $this->effective_from?->toIso8601String(),
            'effective_to' => $this->effective_to?->toIso8601String(),
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
