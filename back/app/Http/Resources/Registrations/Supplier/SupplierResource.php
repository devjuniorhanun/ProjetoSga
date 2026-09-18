<?php

namespace App\Http\Resources\Registrations\Supplier;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Registrations\Supplier\TypeSupplierResource;

/**
 * Classe SupplierResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class SupplierResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo corporate_reason.
            'corporate_reason' => $this->corporate_reason,
            // Expõe o campo fantasy_name.
            'fantasy_name' => $this->fantasy_name,
            // Expõe o campo type.
            'type' => $this->type,
            // Expõe o campo cpf_cnpj.
            'cpf_cnpj' => $this->cpf_cnpj,
            // Expõe o campo rg_ie.
            'rg_ie' => $this->rg_ie,
            // Expõe o campo status.
            'status' => $this->status,
            //'typeSuppliers' => TypeSupplierResource::collection($this->whenLoaded('types')),
            'typeSuppliers' => $this->types->pluck('id'),
            'type_supplier_ids' => $this->types->pluck('id'),
        ];
    }
}
