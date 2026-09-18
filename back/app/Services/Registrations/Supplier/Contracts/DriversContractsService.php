<?php

namespace App\Services\Registrations\Supplier\Contracts;

use App\Models\Registrations\Supplier\Contracts\DriversContracts;

/**
 * Classe DriversContractsService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class DriversContractsService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return DriversContracts::query()->with(['crop','drivers'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): DriversContracts
    {
        // Persiste os dados no banco.
        return DriversContracts::create($data);
    }

    // Atualiza um registro existente.
    public function update(DriversContracts $item, array $data): DriversContracts
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(DriversContracts $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
