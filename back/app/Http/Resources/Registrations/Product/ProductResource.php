<?php

namespace App\Http\Resources\Registrations\Product;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe ProductResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ProductResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo product_group_id.
            'product_group_id' => $this->product_group_id,
            'group_product_name' => $this->productGroup->name,
            // Expõe o campo sub_group_product_id.
            'sub_group_product_id' => $this->sub_group_product_id,
            'sub_group_product_name' => $this->subGroupProduct->name,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo stock.
            'stock' => $this->stock,
            'reserved_stock' => $this->reserved_stock,
            'available_stock' => round((float) $this->stock - (float) $this->reserved_stock, 3),
            'average_cost' => $this->average_cost,
            'stock_total_value' => $this->stock_total_value,
            // Expõe o campo stock_location.
            'stock_location' => $this->stock_location,
            // Expõe o campo minimum_quantity.
            'minimum_quantity' => $this->minimum_quantity,
            // Expõe o campo drum_box.
            'drum_box' => $this->drum_box,
            // Expõe o campo gallon_package.
            'gallon_package' => $this->gallon_package,
            // Expõe o campo unit.
            'unit' => $this->unit,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
