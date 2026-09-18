<?php

// Define o namespace do request de variedades.
namespace App\Http\Requests\Registrations\Harvest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Valida os dados de uma variedade de cultura.
class VarietyCultureRequest extends FormRequest
{
    // Autoriza a validação para a rota autenticada.
    public function authorize(): bool
    {
        return true;
    }

    // Define as regras de negócio do formulário.
    public function rules(): array
    {
        // Obtém o ID atual para ignorá-lo na validação de unicidade.
        $id = $this->route('variety')?->id
            ?? $this->route('variety');

        return [
            // Toda variedade pertence a uma cultura existente.
            'culture_id' => [
                'required',
                'integer',
                'exists:cultures,id',
            ],

            // O nome deve ser único dentro da mesma cultura.
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('variety_cultures', 'name')
                    ->where(fn ($query) => $query->where(
                        'culture_id',
                        $this->input('culture_id'),
                    ))
                    ->ignore($id),
            ],

            // Tecnologia utilizada pela variedade.
            'technology' => [
                'required',
                'string',
                'max:100',
            ],

            // Ciclo da variedade.
            'cycle' => [
                'required',
                'string',
                'max:100',
            ],

            // Quantidade de dias de florescimento.
            'flowering_days' => [
                'nullable',
                'integer',
                'min:0',
                'max:3650',
            ],

            // Status operacional.
            'status' => [
                'sometimes',
                Rule::in(['A', 'I']),
            ],
        ];
    }

    // Mensagens em português brasileiro.
    public function messages(): array
    {
        return [
            'culture_id.required' => 'A cultura é obrigatória.',
            'culture_id.integer' => 'A cultura deve ser um identificador válido.',
            'culture_id.exists' => 'A cultura selecionada não existe.',
            'name.required' => 'O nome é obrigatório.',
            'name.unique' => 'O nome já está sendo utilizado nesta cultura.',
            'technology.required' => 'A tecnologia é obrigatória.',
            'cycle.required' => 'O ciclo é obrigatório.',
            'flowering_days.integer' => 'Os dias de florescimento devem ser um número inteiro.',
            'flowering_days.min' => 'Os dias de florescimento não podem ser negativos.',
            'status.in' => 'O status deve ser A para Ativo ou I para Inativo.',
        ];
    }

    // Nomes amigáveis dos campos.
    public function attributes(): array
    {
        return [
            'culture_id' => 'cultura',
            'name' => 'nome',
            'technology' => 'tecnologia',
            'cycle' => 'ciclo',
            'flowering_days' => 'dias de florescimento',
            'status' => 'status',
        ];
    }
}
