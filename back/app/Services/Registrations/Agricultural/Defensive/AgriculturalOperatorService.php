<?php

namespace App\Services\Registrations\Agricultural\Defensive;

use App\Models\Registrations\Agricultural\Defensive\AgriculturalOperator;

/**
 * Classe AgriculturalOperatorService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class AgriculturalOperatorService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return AgriculturalOperator::query()->with(['supplier'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): AgriculturalOperator
    {
        // Persiste os dados no banco.
        return AgriculturalOperator::create($data)->load('supplier');
    }

    // Atualiza um registro existente.
    public function update(AgriculturalOperator $item, array $data): AgriculturalOperator
    {
        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh()->load('supplier');
    }

    // Remove logicamente o registro.
    public function delete(AgriculturalOperator $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
