<?php

namespace App\Http\Resources\Registrations\Supplier\Contracts;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe DriversContractsResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class DriversContractsResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            'contract_number' => $this->contract_number,
            'generation_batch' => $this->generation_batch,
            // Expõe o campo crop_id.
            'crop_id' => $this->crop_id,
            'producer_id' => $this->producer_id,
            'supplier_id' => $this->supplier_id,
            'bank_supplier_id' => $this->bank_supplier_id,
            // Expõe o campo opening_date.
            'opening_date' => $this->opening_date,
            // Expõe o campo closing_date.
            'closing_date' => $this->closing_date,
            // Expõe o campo shipping_cost.
            'shipping_cost' => $this->shipping_cost,
            'calculation_basis' => $this->calculation_basis,
            'bag_weight' => $this->bag_weight,
            'service_hours' => $this->service_hours,
            'extra_service_description' => $this->extra_service_description,
            'observations' => $this->observations,
            'producer_snapshot' => $this->producer_snapshot,
            'supplier_snapshot' => $this->supplier_snapshot,
            'participants_snapshot' => $this->participants_snapshot,
            'bank_snapshot' => $this->bank_snapshot,
            'pdf_hash' => $this->pdf_hash,
            'generated_at' => $this->generated_at,
            'pdf_generated_at' => $this->pdf_generated_at,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
