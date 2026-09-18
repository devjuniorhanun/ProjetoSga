<?php

namespace App\Http\Resources\Registrations\Financial;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe AdministrativeCenterResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class AdministrativeCenterResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo producer_id.
            'producer_id' => $this->producer_id,
            // Expõe o campo farm_id.
            'farm_id' => $this->farm_id,
            // Expõe o campo cei.
            'cei' => $this->cei,
            // Expõe o campo state_registration.
            'state_registration' => $this->state_registration,
            // Expõe o campo status.
            'status' => $this->status,
            'producer_name' => $this->producer?->owner?->corporate_name,
            'farm_name' => $this->farm?->name,
        ];
    }
}
