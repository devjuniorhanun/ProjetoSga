<?php

namespace App\Services\Registrations\Financial;

use App\Models\Registrations\Financial\AdministrativeCenter;

/**
 * Classe AdministrativeCenterService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class AdministrativeCenterService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list(?int $producerId = null)
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return AdministrativeCenter::query()
            ->with(['producer.owner', 'farm'])
            ->when($producerId, fn ($query) => $query->where('producer_id', $producerId))
            ->orderBy('id')
            ->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): AdministrativeCenter
    {
        // Persiste os dados no banco.
        return AdministrativeCenter::create($data);
    }

    // Atualiza um registro existente.
    public function update(AdministrativeCenter $item, array $data): AdministrativeCenter
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(AdministrativeCenter $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
