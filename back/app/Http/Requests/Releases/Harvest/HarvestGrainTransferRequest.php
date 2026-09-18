<?php

namespace App\Http\Requests\Releases\Harvest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HarvestGrainTransferRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'crop_id' => [$required, 'integer', 'exists:crops,id'],
            'producer_id' => [$required, 'integer', 'exists:producers,id'],
            'owner_id' => [$required, 'integer', Rule::exists('owners', 'id')->where(
                fn ($query) => $query->where('payment_type', 'T')->where('status', 'A')->whereNull('deleted_at'))],
            'warehouse_id' => [$required, 'integer', 'exists:warehouses,id'],
            'culture_id' => [$required, 'integer', 'exists:cultures,id'],
            'transfer_date' => [$required, 'date_format:Y-m-d'],
            'quantity_kg' => [$required, 'numeric', 'gt:0', 'decimal:0,3'],
            'observation' => ['nullable', 'string', 'max:2000'],
            'status' => ['sometimes', Rule::in(['A', 'I'])],
        ];
    }

    public function messages(): array
    {
        return [
            'owner_id.exists' => 'O proprietário deve estar ativo e possuir payment_type igual a T.',
            'quantity_kg.gt' => 'A quantidade da transferência deve ser maior que zero.',
        ];
    }
}
