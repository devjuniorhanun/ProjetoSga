<?php

namespace App\Services\Registrations\Supplier\Contracts;

use App\Models\Registrations\Supplier\Contracts\DriverContract;

/**
 * Classe DriverContractService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class DriverContractService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return DriverContract::query()->with(['contract','driver'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): DriverContract
    {
        // Persiste os dados no banco.
        return DriverContract::create($data);
    }

    // Atualiza um registro existente.
    public function update(DriverContract $item, array $data): DriverContract
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(DriverContract $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
