<?php

namespace App\Http\Resources\Registrations\Vehicle;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Classe FleetResource.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FleetResource extends JsonResource {
// Transforma o modelo Eloquent em uma resposta JSON padronizada.
    public function toArray($request): array
    {
        // Retorna somente os dados definidos como contrato público da API.
        return [
            'id' => $this->id,
            // Expõe o campo fleet_group_id.
            'fleet_group_id' => $this->fleet_group_id,
            'fleet_group_name' => $this->group->name,
            // Expõe o campo fleet_brand_id.
            'fleet_brand_id' => $this->fleet_brand_id,
            'fleet_brand_name' => $this->brand->name,
            // Expõe o campo fleet_model_id.
            'fleet_model_id' => $this->fleet_model_id,
            'fleet_model_name' => $this->model->name,
            // Expõe o campo name.
            'name' => $this->name,
            // Expõe o campo code.
            'code' => $this->code,
            // Expõe o campo plate.
            'plate' => $this->plate,
            // Expõe o campo fleet_type.
            'fleet_type' => $this->fleet_type,
            // Expõe o campo year.
            'year' => $this->year,
            // Expõe o campo chassi.
            'chassi' => $this->chassi,
            // Expõe o campo acquisition_date.
            'acquisition_date' => $this->acquisition_date,
            // Expõe o campo acquisition_value.
            'acquisition_value' => $this->acquisition_value,
            // Expõe o campo fuel_type.
            'fuel_type' => $this->fuel_type,
            // Expõe o campo marking_type.
            'marking_type' => $this->marking_type,
            // Expõe o campo starting_meter.
            'starting_meter' => $this->starting_meter,
            // Expõe o campo end_gauge.
            'end_gauge' => $this->end_gauge,
            // Expõe o campo status.
            'status' => $this->status,
        ];
    }
}
