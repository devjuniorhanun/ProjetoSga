<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Requests\Auth;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Foundation\Http\FormRequest;

// Declara a classe responsável por esta parte do domínio.
class LoginRequest extends FormRequest
// Abre o bloco de código atual.
{
// Declara o método responsável por esta operação.
    public function authorize(): bool { return true; }

// Declara o método responsável por esta operação.
    public function rules(): array
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return [
// Exige que o campo seja informado.
            'email' => ['required', 'email', 'max:255'],
// Exige que o campo seja informado.
            'password' => ['required', 'string', 'max:100'],
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
