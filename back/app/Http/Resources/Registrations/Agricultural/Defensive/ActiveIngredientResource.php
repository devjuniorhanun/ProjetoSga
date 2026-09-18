<?php

namespace App\Http\Resources\Registrations\Agricultural\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe ActiveIngredientResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ActiveIngredientResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo agricultural_product_id.
            'agricultural_product_id' => $this->agricultural_product_id,
            // Expõe o campo active_ingredient.
            'active_ingredient' => $this->active_ingredient,
            // Expõe o campo concentration.
            'concentration' => $this->concentration,
        ];
    }
}
