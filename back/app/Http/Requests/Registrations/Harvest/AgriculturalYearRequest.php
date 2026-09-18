<?php

// Define o namespace do request de anos agrícolas.
namespace App\Http\Requests\Registrations\Harvest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Valida os dados recebidos para criar ou alterar um ano agrícola.
class AgriculturalYearRequest extends FormRequest
{
    // Permite que o request seja utilizado pela rota protegida.
    public function authorize(): bool
    {
        return true;
    }

    // Define as regras de validação.
    public function rules(): array
    {
        // Obtém o ID do registro atual quando a operação for uma atualização.
        $id = $this->route('agricultural_year')?->id
            ?? $this->route('agricultural_year');

        return [
            // Nome do ano agrícola é obrigatório e único.
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('agricultural_years', 'name')->ignore($id),
            ],

            // Data inicial é obrigatória.
            'opening_date' => [
                'required',
                'date',
            ],

            // Data final deve ser igual ou posterior à inicial.
            'closing_date' => [
                'required',
                'date',
                'after_or_equal:opening_date',
            ],

            // Status é opcional para permitir o default A da aplicação/banco.
            'status' => [
                'sometimes',
                Rule::in(['A', 'I']),
            ],
        ];
    }

    // Retorna mensagens de validação em português brasileiro.
    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório.',
            'name.unique' => 'O nome já está sendo utilizado.',
            'opening_date.required' => 'A data de abertura é obrigatória.',
            'opening_date.date' => 'A data de abertura deve ser uma data válida.',
            'closing_date.required' => 'A data de encerramento é obrigatória.',
            'closing_date.date' => 'A data de encerramento deve ser uma data válida.',
            'closing_date.after_or_equal' => 'A data de encerramento deve ser igual ou posterior à data de abertura.',
            'status.in' => 'O status deve ser A para Ativo ou I para Inativo.',
        ];
    }

    // Define nomes amigáveis para as mensagens.
    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'opening_date' => 'data de abertura',
            'closing_date' => 'data de encerramento',
            'status' => 'status',
        ];
    }
}
