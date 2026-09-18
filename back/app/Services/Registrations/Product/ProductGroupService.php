<?php

namespace App\Services\Registrations\Product;

use App\Models\Registrations\Product\ProductGroup;

/**
 * Classe ProductGroupService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ProductGroupService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return ProductGroup::query()->with(['products'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): ProductGroup
    {
        // Persiste os dados no banco.
        return ProductGroup::create($data);
    }

    // Atualiza um registro existente.
    public function update(ProductGroup $item, array $data): ProductGroup
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(ProductGroup $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
