<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\BankSupplier;

/**
 * Classe BankSupplierService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class BankSupplierService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return BankSupplier::query()->with(['supplier'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): BankSupplier
    {
        // Persiste os dados no banco.
        return BankSupplier::create($data);
    }

    // Atualiza um registro existente.
    public function update(BankSupplier $item, array $data): BankSupplier
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(BankSupplier $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
