<?php

namespace App\Http\Requests\Reports\Financial;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaidAccountReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->filled('date_from') && ! $this->filled('date_to')) {
            $this->merge([
                'date_from' => now()->startOfMonth()->toDateString(),
                'date_to' => now()->endOfMonth()->toDateString(),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'date_from' => ['required', 'date_format:Y-m-d'],
            'date_to' => ['required', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'producer_id' => ['nullable', 'integer', 'exists:producers,id'],
            'administrative_center_id' => ['nullable', 'integer', 'exists:administrative_centers,id'],
            'cost_center_id' => ['nullable', 'integer', 'exists:cost_centers,id'],
            'supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'type_pay_account_id' => ['nullable', 'integer', 'exists:type_pay_accounts,id'],
            'accounted_for' => ['nullable', Rule::in(['N', 'S'])],
            'status' => ['nullable', Rule::in(['CA', 'CO', 'RI', 'FA'])],
            'entry_type' => ['nullable', Rule::in(['ACCOUNT', 'PAYROLL', 'HARVESTER_ADVANCE', 'TRANSPORTER_ADVANCE'])],
            'section' => ['nullable', Rule::in(['ALL', 'PAYROLL', 'ADVANCE', 'CASH', 'CHECK', 'BOLETO', 'TRANSFER', 'OTHER'])],
            'group_by' => ['nullable', Rule::in(['SUPPLIER', 'COST_CENTER', 'PAYMENT_TYPE'])],
            'order_by' => ['nullable', Rule::in(['NAME_ASC', 'VALUE_ASC', 'VALUE_DESC'])],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'A data final deve ser igual ou posterior à data inicial.',
        ];
    }
}
