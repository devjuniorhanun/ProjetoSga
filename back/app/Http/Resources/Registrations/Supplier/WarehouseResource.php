<?php

namespace App\Http\Resources\Registrations\Supplier;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe WarehouseResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class WarehouseResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo supplier_id.
            'supplier_id' => $this->supplier_id,
            'supplier_name' => $this->supplier->corporate_reason,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo city.
            'city' => $this->city,
            // Expõe o campo type.
            'type' => $this->type,
            // Expõe o campo route.
            'route' => $this->route,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
