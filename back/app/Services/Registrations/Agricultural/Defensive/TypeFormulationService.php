<?php

namespace App\Services\Registrations\Agricultural\Defensive;

use App\Models\Registrations\Agricultural\Defensive\TypeFormulation;
use App\Services\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProductSequenceService;
use Illuminate\Support\Facades\DB;

/**
 * Classe TypeFormulationService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class TypeFormulationService {
    public function __construct(
        private AgriculturalDefensiveOrderProductSequenceService $productSequenceService
    ) {
    }
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return TypeFormulation::query()->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): TypeFormulation
    {
        // Persiste os dados no banco.
        return TypeFormulation::create($data);
    }

    // Atualiza um registro existente.
    public function update(TypeFormulation $item, array $data): TypeFormulation
    {
        return DB::transaction(function () use ($item, $data): TypeFormulation {
            $previousOrder = (int) $item->order;
            $item->update($data);

            if (array_key_exists('order', $data) && $previousOrder !== (int) $item->order) {
                $this->productSequenceService->resequenceOpenOrders();
            }

            return $item->refresh();
        });
    }

    // Remove logicamente o registro.
    public function delete(TypeFormulation $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
