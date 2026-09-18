<?php

namespace App\Services\Registrations\Financial;

use App\Models\Registrations\Financial\TypePayAccount;

/**
 * Classe TypePayAccountService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypePayAccountService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return TypePayAccount::query()->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): TypePayAccount
    {
        // Persiste os dados no banco.
        return TypePayAccount::create($data);
    }

    // Atualiza um registro existente.
    public function update(TypePayAccount $item, array $data): TypePayAccount
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(TypePayAccount $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
