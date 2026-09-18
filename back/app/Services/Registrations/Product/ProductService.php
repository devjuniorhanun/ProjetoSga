<?php

namespace App\Services\Registrations\Product;

use App\Models\Registrations\Product\Product;

/**
 * Classe ProductService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class ProductService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Product::query()->with(['productGroup','subGroupProduct','supplierProducts','agriculturalProduct'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Product
    {
        // Persiste os dados no banco.
        return Product::create($data)->load(['productGroup', 'subGroupProduct']);
    }

    // Atualiza um registro existente.
    public function update(Product $item, array $data): Product
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh()->load(['productGroup', 'subGroupProduct']);
    }

    // Remove logicamente o registro.
    public function delete(Product $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
