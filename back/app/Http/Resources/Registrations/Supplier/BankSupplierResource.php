<?php

namespace App\Http\Resources\Registrations\Supplier;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe BankSupplierResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class BankSupplierResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo supplier_id.
            'supplier_id' => $this->supplier_id,
            // Expõe o campo supplier_name.
            'supplier_name' => $this->supplier_name,
            // Expõe o campo bank_name.
            'bank_name' => $this->bank_name,
            // Expõe o campo agency_number.
            'agency_number' => $this->agency_number,
            // Expõe o campo account_number.
            'account_number' => $this->account_number,
            // Expõe o campo operation_number.
            'operation_number' => $this->operation_number,
            // Expõe o campo pix_key.
            'pix_key' => $this->pix_key,
            // Expõe o campo account_type.
            'account_type' => $this->account_type,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
