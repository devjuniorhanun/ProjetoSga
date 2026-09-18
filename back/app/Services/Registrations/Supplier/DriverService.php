<?php

namespace App\Services\Registrations\Supplier;

use App\Models\Registrations\Supplier\Driver;

/**
 * Classe DriverService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class DriverService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Driver::query()->with(['supplier'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Driver
    {
        // Persiste os dados no banco.
        return Driver::create($data);
    }

    // Atualiza um registro existente.
    public function update(Driver $item, array $data): Driver
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Driver $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
