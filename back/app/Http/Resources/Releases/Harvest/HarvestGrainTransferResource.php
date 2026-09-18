<?php

namespace App\Http\Resources\Releases\Harvest;

use Illuminate\Http\Resources\Json\JsonResource;

class HarvestGrainTransferResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'crop_id' => $this->crop_id,
            'crop_name' => $this->crop?->name,
            'producer_id' => $this->producer_id,
            'producer_name' => $this->producer?->owner?->corporate_name,
            'owner_id' => $this->owner_id,
            'owner_name' => $this->owner?->corporate_name,
            'owner_payment_type' => $this->owner?->payment_type,
            'warehouse_id' => $this->warehouse_id,
            'warehouse_name' => $this->warehouse?->name,
            'culture_id' => $this->culture_id,
            'culture_name' => $this->culture?->name,
            'transfer_date' => $this->transfer_date?->format('Y-m-d'),
            'quantity_kg' => (float) $this->quantity_kg,
            'quantity_bags' => (float) $this->quantity_bags,
            'observation' => $this->observation,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
