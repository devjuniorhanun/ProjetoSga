<?php

namespace App\Services\Registrations\Agricultural\Defensive;

use App\Models\Registrations\Agricultural\Defensive\ActiveIngredient;

/**
 * Classe ActiveIngredientService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ActiveIngredientService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return ActiveIngredient::query()->with(['agriculturalProduct'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): ActiveIngredient
    {
        // Persiste os dados no banco.
        return ActiveIngredient::create($data);
    }

    // Atualiza um registro existente.
    public function update(ActiveIngredient $item, array $data): ActiveIngredient
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(ActiveIngredient $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
