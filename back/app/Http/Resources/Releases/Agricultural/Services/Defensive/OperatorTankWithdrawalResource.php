<?php

namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

use Illuminate\Http\Resources\Json\JsonResource;

class OperatorTankWithdrawalResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'withdrawal_number' => $this->withdrawal_number,
            'crop_id' => $this->crop_id,
            'crop_name' => $this->crop?->name,
            'operator_tank_id' => $this->operator_tank_id,
            'operator_id' => $this->tank?->operator_id,
            'operator_name' => $this->tank?->operator?->supplier?->fantasy_name
                ?: $this->tank?->operator?->supplier?->corporate_reason,
            'cutoff_date' => $this->cutoff_date?->format('Y-m-d'),
            'occurred_at' => $this->occurred_at?->toIso8601String(),
            'observation' => $this->observation,
            'created_by' => $this->created_by,
            'created_by_name' => $this->creator?->name,
            'status' => $this->status,
            'items_count' => $this->whenCounted('items'),
            'items' => OperatorTankWithdrawalItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
