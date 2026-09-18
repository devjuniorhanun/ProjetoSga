<?php

namespace App\Http\Requests\Reports\Financial;

use Illuminate\Database\Query\Builder;
use Illuminate\Validation\Rule;

class PaidAccountByCropReportRequest extends PaidAccountReportRequest
{
    public function rules(): array
    {
        return [
            ...parent::rules(),
            'agricultural_year_id' => [
                'required', 'integer',
                Rule::exists('agricultural_years', 'id')->where(fn (Builder $query): Builder => $query->whereNull('deleted_at')),
            ],
            'crop_id' => [
                'required', 'integer',
                Rule::exists('crops', 'id')->where(fn (Builder $query): Builder => $query
                    ->where('agricultural_year_id', $this->input('agricultural_year_id'))
                    ->whereNull('deleted_at')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            ...parent::messages(),
            'agricultural_year_id.required' => 'Informe o ano agrícola.',
            'crop_id.required' => 'Informe a safra.',
            'crop_id.exists' => 'A safra selecionada deve pertencer ao ano agrícola informado.',
        ];
    }
}
