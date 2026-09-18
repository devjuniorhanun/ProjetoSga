<?php

// Define o namespace do request de culturas.
namespace App\Http\Requests\Registrations\Harvest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Valida os dados de uma cultura agrícola.
class CultureRequest extends FormRequest
{
    // Autoriza a execução da validação.
    public function authorize(): bool
    {
        return true;
    }

    // Define as regras do formulário.
    public function rules(): array
    {
        // Obtém o ID atual para que o próprio registro possa manter seu nome.
        $id = $this->route('culture')?->id
            ?? $this->route('culture');

        return [
            // O nome é obrigatório e não pode ser duplicado.
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('cultures', 'name')->ignore($id),
            ],

            // Aceita somente os estados definidos pelo sistema.
            'status' => [
                'sometimes',
                Rule::in(['A', 'I']),
            ],
        ];
    }

    // Mensagens de validação em português brasileiro.
    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'name.unique' => 'O nome já está sendo utilizado.',
            'status.in' => 'O status deve ser A para Ativo ou I para Inativo.',
        ];
    }

    // Nomes amigáveis dos campos.
    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'status' => 'status',
        ];
    }
}
