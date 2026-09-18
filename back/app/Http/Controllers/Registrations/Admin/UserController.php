<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Admin\UserRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Admin\UserResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Admin\User;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Http\JsonResponse;

// Declara a classe responsável por esta parte do domínio.
class UserController extends Controller
// Abre o bloco de código atual.
{
// Declara o método responsável por esta operação.
    public function index(): JsonResponse
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return response()->json(UserResource::collection(User::with('roles')->orderBy('name')->get())->resolve());
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function store(UserRequest $request): JsonResponse
// Abre o bloco de código atual.
    {
// Obtém somente os dados aprovados pelas regras de validação.
        $data = $request->validated();
// Executa a instrução correspondente à regra ou operação atual.
        $roleIds = $data['role_ids'];
// Executa a instrução correspondente à regra ou operação atual.
        unset($data['role_ids']);
// Executa a instrução correspondente à regra ou operação atual.
        $user = User::create($data);
// Executa a instrução correspondente à regra ou operação atual.
        $user->roles()->sync($roleIds);
// Retorna o resultado da operação atual.
        return response()->json(new UserResource($user->load('roles')), 201);
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function show(User $user): JsonResponse
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return response()->json(new UserResource($user->load('roles')));
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function update(UserRequest $request, User $user): JsonResponse
// Abre o bloco de código atual.
    {
// Obtém somente os dados aprovados pelas regras de validação.
        $data = $request->validated();
// Executa a instrução correspondente à regra ou operação atual.
        $roleIds = $data['role_ids'];
// Executa a instrução correspondente à regra ou operação atual.
        unset($data['role_ids']);
// Verifica a condição antes de continuar a execução.
        if (array_key_exists('password', $data) && $data['password'] === null) unset($data['password']);
// Executa a instrução correspondente à regra ou operação atual.
        $user->update($data);
// Executa a instrução correspondente à regra ou operação atual.
        $user->roles()->sync($roleIds);
// Retorna o resultado da operação atual.
        return response()->json(new UserResource($user->refresh()->load('roles')));
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function destroy(User $user): JsonResponse
// Abre o bloco de código atual.
    {
// Verifica a condição antes de continuar a execução.
        if (request()->user()->is($user)) {
// Retorna o resultado da operação atual.
            return response()->json(['message' => 'O usuário autenticado não pode excluir a própria conta.'], 422);
// Fecha o bloco de código atual.
        }
// Executa a instrução correspondente à regra ou operação atual.
        $user->delete();
// Retorna o resultado da operação atual.
        return response()->json(['message' => 'Usuário excluído com sucesso.']);
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
