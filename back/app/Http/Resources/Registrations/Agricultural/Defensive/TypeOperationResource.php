<?php

namespace App\Http\Resources\Registrations\Agricultural\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe TypeOperationResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeOperationResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            'operation_defensive_id' => $this->operation_defensive_id,
            'operation_defensive_name' => $this->operationDefensive?->name,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
