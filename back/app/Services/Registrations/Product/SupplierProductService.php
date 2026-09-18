<?php

namespace App\Services\Registrations\Product;

use App\Models\Registrations\Product\SupplierProduct;

/**
 * Classe SupplierProductService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class SupplierProductService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return SupplierProduct::query()->with(['supplier','product'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): SupplierProduct
    {
        // Persiste os dados no banco.
        return SupplierProduct::create($data);
    }

    // Atualiza um registro existente.
    public function update(SupplierProduct $item, array $data): SupplierProduct
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(SupplierProduct $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
