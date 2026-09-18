<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Auth\LoginRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Admin\UserResource;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Http\JsonResponse;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Http\Request;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Support\Facades\Auth;

// Declara a classe responsável por esta parte do domínio.
class AuthController extends Controller
// Abre o bloco de código atual.
{
// Declara o método responsável por esta operação.
    public function login(LoginRequest $request): JsonResponse
// Abre o bloco de código atual.
    {
// Obtém somente os dados aprovados pelas regras de validação.
        $credentials = $request->validated();

// Verifica a condição antes de continuar a execução.
        if (! Auth::attempt($credentials)) {
// Retorna o resultado da operação atual.
            return response()->json(['message' => 'E-mail ou senha inválidos.'], 401);
// Fecha o bloco de código atual.
        }

// Executa a instrução correspondente à regra ou operação atual.
        $user = Auth::user();
// Verifica a condição antes de continuar a execução.
        if ($user->status !== 'A') {
// Executa a instrução correspondente à regra ou operação atual.
            Auth::logout();
// Retorna o resultado da operação atual.
            return response()->json(['message' => 'Usuário inativo.'], 403);
// Fecha o bloco de código atual.
        }

// Executa a instrução correspondente à regra ou operação atual.
        $token = $user->createToken('react-client')->plainTextToken;

// Retorna o resultado da operação atual.
        return response()->json([
// Define este campo ou configuração na estrutura atual.
            'token_type' => 'Bearer',
// Define este campo ou configuração na estrutura atual.
            'access_token' => $token,
// Converte o modelo para o Resource correspondente.
            'user' => new UserResource($user->load('roles')),
// Executa a instrução correspondente à regra ou operação atual.
        ]);
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function me(Request $request): JsonResponse
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return response()->json(['user' => new UserResource($request->user()->load('roles'))]);
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function logout(Request $request): JsonResponse
// Abre o bloco de código atual.
    {
// Executa a instrução correspondente à regra ou operação atual.
        $request->user()?->currentAccessToken()?->delete();
// Retorna o resultado da operação atual.
        return response()->json(['message' => 'Logout realizado com sucesso.']);
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
