<?php

namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

use Illuminate\Foundation\Http\FormRequest;

class AgriculturalDefensiveOrderReissueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'previous_os' => ['required', 'array', 'min:1'],
            'previous_os.*' => ['required', 'array'],
            'previous_os.*.os_number' => [
                'required',
                'integer',
                'exists:agricultural_defensive_orders,os_number',
            ],
            'previous_os.*.quantity_used' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
        ];
    }

    public function attributes(): array
    {
        return [
            'previous_os' => 'ordens anteriores',
            'previous_os.*.os_number' => 'número da O.S. anterior',
            'previous_os.*.quantity_used' => 'quantidade usada da O.S. anterior',
        ];
    }
}
