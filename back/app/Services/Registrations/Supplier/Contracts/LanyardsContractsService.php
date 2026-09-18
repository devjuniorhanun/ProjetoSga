<?php

namespace App\Services\Registrations\Supplier\Contracts;

use App\Models\Registrations\Supplier\Contracts\LanyardsContracts;

/**
 * Classe LanyardsContractsService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class LanyardsContractsService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return LanyardsContracts::query()->with(['crop','lanyards'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): LanyardsContracts
    {
        // Persiste os dados no banco.
        return LanyardsContracts::create($data);
    }

    // Atualiza um registro existente.
    public function update(LanyardsContracts $item, array $data): LanyardsContracts
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(LanyardsContracts $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
