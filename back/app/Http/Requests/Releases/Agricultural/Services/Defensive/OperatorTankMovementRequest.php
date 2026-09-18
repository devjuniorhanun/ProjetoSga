<?php

// Define o namespace das movimentações do tanque.
namespace App\Http\Requests\Releases\Agricultural\Services\Defensive;

// Importa a classe base de FormRequest.
use Illuminate\Foundation\Http\FormRequest;
// Importa Rule para valores permitidos.
use Illuminate\Validation\Rule;

// Valida retirada do estoque e devolução do tanque.
class OperatorTankMovementRequest extends FormRequest
{
    // Autoriza usuários autenticados.
    public function authorize(): bool { return true; }
    // Define as regras.
    public function rules(): array
    {
        // Retorna o contrato da API.
        return [
            // Identifica o tanque.
            'operator_tank_id' => ['required', 'integer', 'exists:operator_tanks,id'],
            // Identifica o produto.
            'product_id' => ['required', 'integer', 'exists:products,id'],
            // Quantidade física movimentada.
            'quantity' => ['nullable', 'numeric', 'gt:0', 'decimal:0,3', 'required_if:movement_type,RETURN'],
            // Tipo da movimentação.
            'movement_type' => ['required', Rule::in(['WITHDRAWAL', 'RETURN'])],
            // OS opcional para rastreabilidade da retirada.
            'order_id' => ['nullable', 'integer', 'exists:agricultural_defensive_orders,id'],
            // Observação opcional.
            'observation' => ['nullable', 'string', 'max:500'],
        ];
    }
    // Define mensagens em português.
    public function messages(): array
    {
        // Retorna as mensagens.
        return [
            // Obrigatório.
            'required' => 'O campo :attribute é obrigatório.',
            // Inteiro.
            'integer' => 'O campo :attribute deve ser um número inteiro.',
            // Numérico.
            'numeric' => 'O campo :attribute deve ser numérico.',
            // Positivo.
            'gt.numeric' => 'O campo :attribute deve ser maior que zero.',
            'decimal' => 'O campo :attribute deve possuir no máximo três casas decimais.',
            // Existente.
            'exists' => 'O registro selecionado em :attribute não existe.',
            // Lista fechada.
            'in' => 'O tipo de movimentação informado é inválido.',
            // Texto.
            'string' => 'O campo :attribute deve ser um texto.',
            // Tamanho.
            'max.string' => 'O campo :attribute não pode ter mais de :max caracteres.',
        ];
    }
    // Traduz os nomes.
    public function attributes(): array
    {
        // Retorna os nomes amigáveis.
        return [
            // Tanque.
            'operator_tank_id' => 'tanque do operador',
            // Produto.
            'product_id' => 'produto',
            // Quantidade.
            'quantity' => 'quantidade',
            // Tipo.
            'movement_type' => 'tipo de movimentação',
            // OS.
            'order_id' => 'ordem de serviço',
            // Observação.
            'observation' => 'observação',
        ];
    }
}
