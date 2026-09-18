<?php

namespace App\Services\Registrations\Property\Areas;

use App\Models\Registrations\Property\Areas\Field;

/**
 * Classe FieldService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FieldService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Field::query()->with(['farm','plotFields'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Field
    {
        // Persiste os dados no banco.
        return Field::create($data);
    }

    // Atualiza um registro existente.
    public function update(Field $item, array $data): Field
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Field $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
