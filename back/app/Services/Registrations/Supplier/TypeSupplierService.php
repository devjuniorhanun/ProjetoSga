<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\TypeSupplier;

/**
 * Classe TypeSupplierService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeSupplierService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return TypeSupplier::query()->with(['suppliers'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): TypeSupplier
    {
        // Persiste os dados no banco.
        return TypeSupplier::create($data);
    }

    // Atualiza um registro existente.
    public function update(TypeSupplier $item, array $data): TypeSupplier
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(TypeSupplier $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
