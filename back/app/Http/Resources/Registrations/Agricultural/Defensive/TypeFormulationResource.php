<?php

namespace App\Http\Resources\Registrations\Agricultural\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe TypeFormulationResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeFormulationResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo formulation.
            'formulation' => $this->formulation,
            // Expõe o campo abbreviation.
            'abbreviation' => $this->abbreviation,
            // Expõe o campo order.
            'order' => $this->order,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
