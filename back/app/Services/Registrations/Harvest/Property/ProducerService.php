<?php

namespace App\Services\Registrations\Harvest\Property;

use App\Models\Registrations\Property\Producer;

/**
 * Classe ProducerService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ProducerService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Producer::query()->with(['owner','farms'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Producer
    {
        // Persiste os dados no banco.
        return Producer::create($data);
    }

    // Atualiza um registro existente.
    public function update(Producer $item, array $data): Producer
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Producer $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
