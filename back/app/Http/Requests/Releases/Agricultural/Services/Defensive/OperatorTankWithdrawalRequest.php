<?php

namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

use Illuminate\Foundation\Http\FormRequest;

class OperatorTankWithdrawalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'operator_id' => ['required', 'integer', 'exists:agricultural_operators,id'],
            'date' => ['required', 'date'],
            'products' => ['required', 'array', 'min:1'],
            'products.*' => ['required', 'array'],
            'products.*.product_id' => ['required', 'integer', 'exists:products,id', 'distinct'],
            'products.*.quantity' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
            'observation' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'required' => 'O campo :attribute é obrigatório.',
            'integer' => 'O campo :attribute deve ser um número inteiro.',
            'date' => 'O campo :attribute deve ser uma data válida.',
            'array' => 'O campo :attribute deve ser uma lista.',
            'min.array' => 'Informe pelo menos um produto.',
            'exists' => 'O registro selecionado em :attribute não existe.',
            'distinct' => 'Não informe produtos repetidos.',
            'numeric' => 'O campo :attribute deve ser numérico.',
            'gt.numeric' => 'O campo :attribute deve ser maior que zero.',
            'decimal' => 'O campo :attribute deve possuir no máximo três casas decimais.',
            'string' => 'O campo :attribute deve ser um texto.',
            'max.string' => 'O campo :attribute não pode ter mais de :max caracteres.',
        ];
    }

    public function attributes(): array
    {
        return [
            'crop_id' => 'safra',
            'operator_id' => 'operador',
            'date' => 'data',
            'products' => 'produtos',
            'products.*.product_id' => 'produto',
            'products.*.quantity' => 'quantidade para retirada',
            'observation' => 'observação',
        ];
    }
}
