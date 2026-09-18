<?php

namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

use Illuminate\Foundation\Http\FormRequest;

class AgriculturalDefensiveOrderProductSequenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_ids' => ['required', 'array', 'min:1'],
            'product_ids.*' => ['required', 'integer', 'distinct', 'exists:products,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'product_ids.required' => 'Informe os produtos na sequência desejada.',
            'product_ids.array' => 'A sequência de produtos deve ser uma lista.',
            'product_ids.min' => 'Informe pelo menos um produto.',
            'product_ids.*.integer' => 'Todos os produtos devem possuir um identificador inteiro.',
            'product_ids.*.distinct' => 'Não informe produtos repetidos.',
            'product_ids.*.exists' => 'Um dos produtos informados não existe.',
        ];
    }
}
