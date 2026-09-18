<?php

namespace App\Http\Resources\Registrations\Supplier\Contracts;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe DriverContractResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class DriverContractResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo drivers_contract_id.
            'drivers_contract_id' => $this->drivers_contract_id,
            // Expõe o campo driver_id.
            'driver_id' => $this->driver_id,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
