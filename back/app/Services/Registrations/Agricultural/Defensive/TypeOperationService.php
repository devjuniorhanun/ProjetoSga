<?php

namespace App\Services\Registrations\Agricultural\Defensive;

use App\Models\Registrations\Agricultural\Defensive\TypeOperation;

/**
 * Classe TypeOperationService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeOperationService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return TypeOperation::query()->with('operationDefensive')->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): TypeOperation
    {
        // Persiste os dados no banco.
        return TypeOperation::create($data);
    }

    // Atualiza um registro existente.
    public function update(TypeOperation $item, array $data): TypeOperation
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(TypeOperation $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
