<?php

namespace App\Services\Registrations\Product;

use App\Models\Registrations\Product\SubGroupProduct;

/**
 * Classe SubGroupProductService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class SubGroupProductService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return SubGroupProduct::query()->with(['productGroup','products'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): SubGroupProduct
    {
        // Persiste os dados no banco.
        return SubGroupProduct::create($data);
    }

    // Atualiza um registro existente.
    public function update(SubGroupProduct $item, array $data): SubGroupProduct
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(SubGroupProduct $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
