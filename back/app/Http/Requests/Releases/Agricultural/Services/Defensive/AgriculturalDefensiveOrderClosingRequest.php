<?php

// Define o namespace da requisição de fechamento.
namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

// Importa a classe base de FormRequest.
use Illuminate\Foundation\Http\FormRequest;
// Importa Rule para valores permitidos.
use Illuminate\Validation\Rule;

// Valida um fechamento parcial ou final de OS.
class AgriculturalDefensiveOrderClosingRequest extends FormRequest
{
    // Permite a validação de usuários autenticados.
    public function authorize(): bool { return true; }
    // Define as regras do fechamento.
    public function rules(): array
    {
        // Retorna as regras do payload.
        return [
            // Localiza a OS pelo número público.
            'os_number' => ['required', 'integer', 'exists:agricultural_defensive_orders,os_number'],
            // Localiza o tanque pelo identificador.
            'operator_tank_id' => ['required', 'integer', 'exists:operator_tanks,id'],
            // Guarda somente as bombas deste fechamento.
            'closing_bomb' => ['required', 'numeric', 'gt:0', 'decimal:0,3'],
            // Define parcial ou final.
            'closing_type' => ['required', Rule::in(['PARTIAL', 'FINAL'])],
        ];
    }
    // Define mensagens em português.
    public function messages(): array
    {
        // Retorna as mensagens.
        return [
            // Campo obrigatório.
            'required' => 'O campo :attribute é obrigatório.',
            // Número inteiro.
            'integer' => 'O campo :attribute deve ser um número inteiro.',
            // Número.
            'numeric' => 'O campo :attribute deve ser numérico.',
            // Maior que zero.
            'gt.numeric' => 'O campo :attribute deve ser maior que zero.',
            'decimal' => 'O campo :attribute deve possuir no máximo três casas decimais.',
            // Existência.
            'exists' => 'O registro selecionado em :attribute não existe.',
            // Lista fechada.
            'in' => 'O tipo de fechamento informado é inválido.',
        ];
    }
    // Traduz os atributos.
    public function attributes(): array
    {
        // Retorna os nomes amigáveis.
        return [
            // Número da OS.
            'os_number' => 'número da OS',
            // Tanque.
            'operator_tank_id' => 'tanque do operador',
            // Bombas do evento.
            'closing_bomb' => 'bombas utilizadas no fechamento',
            // Tipo.
            'closing_type' => 'tipo de fechamento',
        ];
    }
}
