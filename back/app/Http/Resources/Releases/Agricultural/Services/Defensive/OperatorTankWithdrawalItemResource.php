<?php

namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

class OperatorTankWithdrawalItemResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'product_name' => $this->product?->name,
            'unit' => $this->product?->unit,
            'quantity' => round((float) $this->quantity, 3),
            'stock_before' => round((float) $this->stock_before, 3),
            'stock_after' => round((float) $this->stock_after, 3),
            'tank_balance_before' => round((float) $this->tank_balance_before, 3),
            'tank_balance_after' => round((float) $this->tank_balance_after, 3),
        ];
    }
}
