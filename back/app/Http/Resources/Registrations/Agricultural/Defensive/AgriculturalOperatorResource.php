<?php

namespace App\Http\Resources\Registrations\Agricultural\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe AgriculturalOperatorResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class AgriculturalOperatorResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo supplier_id.
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->fantasy_name,
            'employee_name' => $this->supplier?->corporate_reason,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
