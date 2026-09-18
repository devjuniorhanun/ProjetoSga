<?php

// Define o namespace do request de safras.
namespace App\Http\Requests\Registrations\Harvest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

// Valida os dados de uma safra agrícola.
class CropRequest extends FormRequest
{
    // Autoriza a validação para a rota autenticada.
    public function authorize(): bool
    {
        return true;
    }

    // Define as regras do formulário.
    public function rules(): array
    {
        // Obtém o ID atual para ignorá-lo na validação de unicidade.
        $id = $this->route('crop')?->id
            ?? $this->route('crop');

        return [
            // Toda safra pertence a um ano agrícola existente.
            'agricultural_year_id' => [
                'required',
                'integer',
                'exists:agricultural_years,id',
            ],

            // O nome é único dentro do ano agrícola.
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('crops', 'name')
                    ->where(fn ($query) => $query->where(
                        'agricultural_year_id',
                        $this->input('agricultural_year_id'),
                    ))
                    ->ignore($id),
            ],

            // Data inicial da safra.
            'opening_date' => [
                'required',
                'date',
            ],

            // Data final deve respeitar a data inicial.
            'closing_date' => [
                'required',
                'date',
                'after_or_equal:opening_date',
            ],

            // Status operacional.
            'status' => [
                'sometimes',
                Rule::in(['A', 'I']),
            ],

            // Lista opcional de culturas vinculadas.
            'culture_ids' => [
                'sometimes',
                'array',
            ],

            // Cada cultura deve existir e não pode se repetir na lista.
            'culture_ids.*' => [
                'integer',
                'distinct',
                'exists:cultures,id',
            ],
        ];
    }

    // Mensagens de validação em português brasileiro.
    public function messages(): array
    {
        return [
            'agricultural_year_id.required' => 'O ano agrícola é obrigatório.',
            'agricultural_year_id.exists' => 'O ano agrícola selecionado não existe.',
            'name.required' => 'O nome é obrigatório.',
            'name.unique' => 'O nome já está sendo utilizado neste ano agrícola.',
            'opening_date.required' => 'A data de abertura é obrigatória.',
            'closing_date.required' => 'A data de encerramento é obrigatória.',
            'closing_date.after_or_equal' => 'A data de encerramento deve ser igual ou posterior à data de abertura.',
            'status.in' => 'O status deve ser A para Ativo ou I para Inativo.',
            'culture_ids.array' => 'As culturas devem ser informadas em uma lista.',
            'culture_ids.*.distinct' => 'A mesma cultura não pode ser informada mais de uma vez.',
            'culture_ids.*.exists' => 'Uma das culturas selecionadas não existe.',
        ];
    }

    // Nomes amigáveis dos campos.
    public function attributes(): array
    {
        return [
            'agricultural_year_id' => 'ano agrícola',
            'name' => 'nome',
            'opening_date' => 'data de abertura',
            'closing_date' => 'data de encerramento',
            'status' => 'status',
            'culture_ids' => 'culturas',
        ];
    }
}
