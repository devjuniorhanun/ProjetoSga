<?php

namespace App\Services\Registrations\Financial;

use App\Models\Registrations\Financial\CostCenter;

/**
 * Classe CostCenterService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class CostCenterService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return CostCenter::query()->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): CostCenter
    {
        // Persiste os dados no banco.
        return CostCenter::create($data);
    }

    // Atualiza um registro existente.
    public function update(CostCenter $item, array $data): CostCenter
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(CostCenter $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
