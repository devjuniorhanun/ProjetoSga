<?php

namespace App\Http\Requests\Reports\Harvest;

use Illuminate\Foundation\Http\FormRequest;

class HarvestReportRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'producer_id' => ['nullable', 'integer', 'exists:producers,id'],
            'owner_id' => ['nullable', 'integer', 'exists:owners,id'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'culture_id' => ['nullable', 'integer', 'exists:cultures,id'],
            'farm_id' => ['nullable', 'integer', 'exists:farms,id'],
            'plot_field_id' => ['nullable', 'integer', 'exists:plot_fields,id'],
            'variety_culture_id' => ['nullable', 'integer', 'exists:variety_cultures,id'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
            'lanyard_id' => ['nullable', 'integer', 'exists:lanyards,id'],
            'order_by' => ['nullable', 'in:NAME_ASC,PRODUCTIVITY_ASC,PRODUCTIVITY_DESC,PRODUCTION_DESC'],
        ];
    }
}
