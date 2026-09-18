<?php

namespace App\Services\Registrations\Harvest\Property;

use App\Models\Registrations\Property\Owner;

/**
 * Classe OwnerService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class OwnerService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Owner::query()->with(['producers'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Owner
    {
        // Persiste os dados no banco.
        return Owner::create($data);
    }

    // Atualiza um registro existente.
    public function update(Owner $item, array $data): Owner
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Owner $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
