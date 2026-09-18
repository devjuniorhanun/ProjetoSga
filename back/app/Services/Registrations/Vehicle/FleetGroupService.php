<?php

namespace App\Services\Registrations\Vehicle;

use App\Models\Registrations\Vehicle\FleetGroup;

/**
 * Classe FleetGroupService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FleetGroupService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return FleetGroup::query()->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): FleetGroup
    {
        // Persiste os dados no banco.
        return FleetGroup::create($data);
    }

    // Atualiza um registro existente.
    public function update(FleetGroup $item, array $data): FleetGroup
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(FleetGroup $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
