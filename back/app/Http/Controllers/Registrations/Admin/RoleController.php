<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Http\Controllers\Registrations\Admin;

// Importa uma dependência utilizada neste arquivo.
use App\Http\Controllers\Controller;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Requests\Registrations\Admin\RoleRequest;
// Importa uma dependência utilizada neste arquivo.
use App\Http\Resources\Registrations\Admin\RoleResource;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Admin\Role;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Http\JsonResponse;

// Declara a classe responsável por esta parte do domínio.
class RoleController extends Controller
// Abre o bloco de código atual.
{
// Declara o método responsável por esta operação.
    public function index(): JsonResponse
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return response()->json(RoleResource::collection(Role::query()->orderBy('name')->get())->resolve());
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function store(RoleRequest $request): JsonResponse
// Abre o bloco de código atual.
    {
// Obtém somente os dados aprovados pelas regras de validação.
        $role = Role::create($request->validated());
// Retorna o resultado da operação atual.
        return response()->json(new RoleResource($role), 201);
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function show(Role $role): JsonResponse
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return response()->json(new RoleResource($role));
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function update(RoleRequest $request, Role $role): JsonResponse
// Abre o bloco de código atual.
    {
// Obtém somente os dados aprovados pelas regras de validação.
        $role->update($request->validated());
// Retorna o resultado da operação atual.
        return response()->json(new RoleResource($role->refresh()));
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function destroy(Role $role): JsonResponse
// Abre o bloco de código atual.
    {
// Verifica a condição antes de continuar a execução.
        if ($role->users()->exists()) {
// Retorna o resultado da operação atual.
            return response()->json(['message' => 'Não é possível excluir uma função que possui usuários vinculados.'], 422);
// Fecha o bloco de código atual.
        }
// Executa a instrução correspondente à regra ou operação atual.
        $role->delete();
// Retorna o resultado da operação atual.
        return response()->json(['message' => 'Função excluída com sucesso.']);
// Fecha o bloco de código atual.
    }
// Fecha o bloco de código atual.
}
