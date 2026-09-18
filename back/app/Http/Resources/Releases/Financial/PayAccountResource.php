<?php

namespace App\Http\Resources\Releases\Financial;

use Illuminate\Http\Resources\Json\JsonResource;

class PayAccountResource extends JsonResource
{
    public function toArray($request): array
    {
        $supplier = $this->whenLoaded('supplier');
        $producer = $this->whenLoaded('producer');
        $administrativeCenter = $this->whenLoaded('administrativeCenter');

        return [
            'id' => $this->id,
            'administrative_center_id' => $this->administrative_center_id,
            'cost_center_id' => $this->cost_center_id,
            'supplier_id' => $this->supplier_id,
            'producer_id' => $this->producer_id,
            'type_pay_account_id' => $this->type_pay_account_id,
            'crop_id' => $this->crop_id,
            'crop_name' => $this->whenLoaded('crop', fn () => $this->crop?->name),
            'agricultural_year_id' => $this->whenLoaded('crop', fn () => $this->crop?->agricultural_year_id),
            'agricultural_year_name' => $this->whenLoaded('crop', fn () => $this->crop?->agriculturalYear?->name),
            'document_number' => $this->document_number,
            'document_date' => $this->document_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),
            'description' => $this->description,
            'value' => (float) $this->value,
            'accounted_for' => $this->accounted_for,
            'status' => $this->status,
            'entry_type' => $this->entry_type,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'administrative_center_name' => $this->administrativeCenter?->farm?->name,
            'cost_center_name' => $this->costCenter?->name,
            'supplier_name' => $this->supplier?->corporate_reason,
            'supplier_cpf_cnpj' => $this->supplier?->cpf_cnpj,
            'producer_name' => $this->producer?->owner?->corporate_name,
            'farm_name' => $this->administrativeCenter?->farm?->name,
            'type_pay_account_name' => $this->typePayAccount?->name,
            'type_pay_account_abbreviation' => $this->typePayAccount?->abbreviation,
            'administrative_center' => $administrativeCenter,
            'cost_center' => $this->whenLoaded('costCenter'),
            'producer' => $producer,
            'type_pay_account' => $this->whenLoaded('typePayAccount'),
            'supplier' => $supplier,
            'bank_suppliers' => $this->when(
                $this->relationLoaded('supplier') && $this->supplier?->relationLoaded('bankSuppliers'),
                fn () => $this->supplier->bankSuppliers->values()
            ),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
