<?php

namespace App\Services\Registrations\Vehicle;

use App\Models\Registrations\Vehicle\FleetModel;

/**
 * Classe FleetModelService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FleetModelService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return FleetModel::query()->with(['brand','fleets'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): FleetModel
    {
        // Persiste os dados no banco.
        return FleetModel::create($data);
    }

    // Atualiza um registro existente.
    public function update(FleetModel $item, array $data): FleetModel
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(FleetModel $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
