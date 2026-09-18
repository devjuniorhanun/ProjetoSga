<?php

namespace App\Http\Resources\Registrations\Property\Areas;

use Illuminate\Http\Resources\Json\JsonResource;

class PlotFieldResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // Expõe o campo field_id.
            'field_id' => $this->field_id,
            'field_name' => $this->field->name,
            'display_name' => $this->name.' - '.$this->field->name,
            // Expõe o campo crop_id.
            'crop_id' => $this->crop_id,
            'crop_name' => $this->crop->name,
            // Expõe o campo culture_id.
            'culture_id' => $this->culture_id,
            'culture_name' => $this->culture->name,
            // Expõe o campo variety_culture_id.
            'variety_culture_id' => $this->variety_culture_id,
            'variety_culture_name' => $this->varietyCulture?->name,
            // Expõe o campo area.
            'area' => $this->area,
            // Expõe o campo pms.
            'pms' => $this->pms,
            // Expõe o campo linear_seed.
            'linear_seed' => $this->linear_seed,
            // Expõe o campo start_planting.
            'start_planting' => $this->start_planting,
            // Expõe o campo final_planting.
            'final_planting' => $this->final_planting,
            // Expõe o campo expected_date.
            'expected_date' => $this->expected_date,
            // Expõe o campo observations.
            'observations' => $this->observations,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
