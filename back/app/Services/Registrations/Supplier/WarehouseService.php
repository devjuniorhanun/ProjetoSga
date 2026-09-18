<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\Warehouse;

/**
 * Classe WarehouseService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class WarehouseService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Warehouse::query()->with(['supplier'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Warehouse
    {
        // Persiste os dados no banco.
        return Warehouse::create($data);
    }

    // Atualiza um registro existente.
    public function update(Warehouse $item, array $data): Warehouse
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Warehouse $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
