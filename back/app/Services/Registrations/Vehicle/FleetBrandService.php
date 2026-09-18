<?php

namespace App\Services\Registrations\Vehicle;

use App\Models\Registrations\Vehicle\FleetBrand;

/**
 * Classe FleetBrandService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FleetBrandService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return FleetBrand::query()->with(['models'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): FleetBrand
    {
        // Persiste os dados no banco.
        return FleetBrand::create($data);
    }

    // Atualiza um registro existente.
    public function update(FleetBrand $item, array $data): FleetBrand
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(FleetBrand $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
