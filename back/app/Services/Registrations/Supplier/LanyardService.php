<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\Lanyard;

/**
 * Classe LanyardService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class LanyardService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Lanyard::query()->with(['supplier'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Lanyard
    {
        // Persiste os dados no banco.
        return Lanyard::create($data);
    }

    // Atualiza um registro existente.
    public function update(Lanyard $item, array $data): Lanyard
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Lanyard $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
