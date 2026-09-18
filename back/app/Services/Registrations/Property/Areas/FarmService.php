<?php

namespace App\Services\Registrations\Property\Areas;

use Illuminate\Validation\ValidationException;
use App\Models\Registrations\Property\Producer;
use App\Models\Registrations\Property\Areas\Farm;



/**
 * Classe FarmService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FarmService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Farm::query()->with(['owner','producer','fields'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Farm
    {
        // Busca o produtor selecionado.
        $producer = Producer::findOrFail($data['producer_id']);

        // Garante que o produtor pertence ao proprietário informado.
        if ((int) $producer->owner_id !== (int) $data['owner_id']) {
            throw ValidationException::withMessages([
                // Informa o campo inconsistente.
                'producer_id' => 'O produtor selecionado não pertence ao proprietário informado.',
            ]);
        }

        // Persiste os dados no banco.
        return Farm::create($data);
    }

    // Atualiza um registro existente.
    public function update(Farm $item, array $data): Farm
    {
        // Define o proprietário final da edição.
        $ownerId = $data['owner_id'] ?? $item->owner_id;
        // Define o produtor final da edição.
        $producerId = $data['producer_id'] ?? $item->producer_id;
        // Busca o produtor final.
        $producer = Producer::findOrFail($producerId);

        // Impede uma associação inconsistente entre produtor e proprietário.
        if ((int) $producer->owner_id !== (int) $ownerId) {
            throw ValidationException::withMessages([
                // Informa o campo inconsistente.
                'producer_id' => 'O produtor selecionado não pertence ao proprietário informado.',
            ]);
        }

        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Farm $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
