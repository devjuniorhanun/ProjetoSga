<?php

namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

class AgriculturalDefensiveOrderOperatorProductResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'agricultural_defensive_order_id' => $this->agricultural_defensive_order_id,
            'agricultural_defensive_order_operator_id' => $this->agricultural_defensive_order_operator_id,
            'operator_id' => $this->orderOperator?->operator_id,
            'operator_name' => $this->orderOperator?->operator?->supplier?->corporate_reason,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'sequence' => $this->order?->products?->firstWhere('product_id', $this->product_id)?->sequence,
            'dose' => round((float) $this->dose, 3),
            'pump' => round((float) $this->pump, 3),
            'area' => $this->area,
            'planned_quantity' => round((float) $this->planned_quantity, 3),
        ];
    }
}
