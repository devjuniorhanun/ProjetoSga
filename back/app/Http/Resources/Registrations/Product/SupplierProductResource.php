<?php

namespace App\Http\Resources\Registrations\Product;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe SupplierProductResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class SupplierProductResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo supplier_id.
            'supplier_id' => $this->supplier_id,
            // Expõe o campo product_id.
            'product_id' => $this->product_id,
            // Expõe o campo product_code.
            'product_code' => $this->product_code,
            // Expõe o campo volume.
            'volume' => $this->volume,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
