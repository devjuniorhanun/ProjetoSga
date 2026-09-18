<?php

namespace App\Http\Resources\Registrations\Supplier\Contracts;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe LanyardContractResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class LanyardContractResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo lanyard_contract_id.
            'lanyard_contract_id' => $this->lanyard_contract_id,
            // Expõe o campo lanyard_id.
            'lanyard_id' => $this->lanyard_id,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
