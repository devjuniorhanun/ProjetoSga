<?php

namespace App\Http\Requests\Releases\Financial;

use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agricultural_year_id' => ['nullable', 'integer', Rule::exists('agricultural_years', 'id')->whereNull('deleted_at')],
            'crop_id' => [
                'required', 'integer',
                Rule::exists('crops', 'id')->where(fn (Builder $query): Builder => $query
                    ->when($this->input('agricultural_year_id'), fn (Builder $q, $id): Builder => $q->where('agricultural_year_id', $id))
                    ->whereNull('deleted_at')),
            ],
            'producer_id' => ['required', 'integer', 'exists:producers,id'],
            'administrative_center_id' => [
                'required',
                'integer',
                Rule::exists('administrative_centers', 'id')->where(
                    fn (Builder $query): Builder => $query
                        ->where('producer_id', $this->input('producer_id'))
                        ->where('status', 'A')
                        ->whereNull('deleted_at')
                ),
            ],
            'supplier_id' => ['required', 'integer', 'exists:suppliers,id'],
            'type_pay_account_id' => ['required', 'integer', 'exists:type_pay_accounts,id'],
            'document_number' => ['required', 'string', 'max:255'],
            'document_date' => ['required', 'date_format:Y-m-d'],
            'description' => ['required', 'string'],
            'value' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'accounted_for' => ['sometimes', Rule::in(['N', 'S'])],
            'status' => ['sometimes', Rule::in(['CA', 'CO', 'RI', 'FA'])],
        ];
    }

    public function messages(): array
    {
        return [
            'administrative_center_id.exists' => 'O centro administrativo deve estar ativo e pertencer ao produtor selecionado.',
            'value.gt' => 'O valor deve ser maior que zero.',
            'value.decimal' => 'O valor deve possuir no máximo duas casas decimais.',
            'crop_id.exists' => 'A safra deve pertencer ao ano agrícola selecionado.',
        ];
    }
}
