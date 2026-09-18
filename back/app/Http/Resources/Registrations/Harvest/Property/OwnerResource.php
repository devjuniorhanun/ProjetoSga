<?php

namespace App\Http\Resources\Registrations\Harvest\Property;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe OwnerResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class OwnerResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo corporate_name.
            'corporate_name' => $this->corporate_name,
            // Expõe o campo fantasy_name.
            'fantasy_name' => $this->fantasy_name,
            // Expõe o campo payment_type.
            'payment_type' => $this->payment_type,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
