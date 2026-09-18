<?php

namespace App\Services\Registrations\Supplier\Contracts;

use App\Models\Registrations\Supplier\Contracts\LanyardContract;

/**
 * Classe LanyardContractService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class LanyardContractService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return LanyardContract::query()->with(['contract','lanyard'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): LanyardContract
    {
        // Persiste os dados no banco.
        return LanyardContract::create($data);
    }

    // Atualiza um registro existente.
    public function update(LanyardContract $item, array $data): LanyardContract
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(LanyardContract $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
