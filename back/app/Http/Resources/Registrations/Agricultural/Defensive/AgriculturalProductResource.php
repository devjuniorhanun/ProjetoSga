<?php

namespace App\Http\Resources\Registrations\Agricultural\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe AgriculturalProductResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class AgriculturalProductResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo product_id.
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            // Expõe o campo type_formulation_id.
            'type_formulation_id' => $this->type_formulation_id,
            'active_ingredient' => $this->activeIngredients->map->only('active_ingredient', 'concentration'),
            'concentration' => $this->activeIngredients->pluck('concentration'),
            'formulation' => $this->typeFormulation?->abbreviation,
            'status' => $this->status,
        ];
    }
}
