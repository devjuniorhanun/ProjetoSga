<?php

namespace App\Http\Resources\Registrations\Supplier;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe LanyardResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class LanyardResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo supplier_id.
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->corporate_reason,
            // Expõe o campo front.
            'front' => $this->front,
            // Expõe o campo machine_quantity.
            'machine_quantity' => $this->machine_quantity,
            // Expõe o campo number_feet.
            'number_feet' => $this->number_feet,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
