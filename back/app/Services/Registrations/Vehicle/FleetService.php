<?php

namespace App\Services\Registrations\Vehicle;

use Illuminate\Validation\ValidationException;
use App\Models\Registrations\Vehicle\FleetModel;
use App\Models\Registrations\Vehicle\Fleet;



/**
 * Classe FleetService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class FleetService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return Fleet::query()->with(['group','brand','model'])->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): Fleet
    {
        // Busca o modelo selecionado.
        $model = FleetModel::findOrFail($data['fleet_model_id']);

        // Garante que o modelo pertence à marca informada.
        if ((int) $model->fleet_brand_id !== (int) $data['fleet_brand_id']) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'fleet_model_id' => 'O modelo selecionado não pertence à marca informada.',
            ]);
        }

        // Persiste os dados no banco.
        return Fleet::create($data);
    }

    // Atualiza um registro existente.
    public function update(Fleet $item, array $data): Fleet
    {
        // Define a marca final da edição.
        $brandId = $data['fleet_brand_id'] ?? $item->fleet_brand_id;
        // Define o modelo final da edição.
        $modelId = $data['fleet_model_id'] ?? $item->fleet_model_id;
        // Busca o modelo final.
        $model = FleetModel::findOrFail($modelId);

        // Impede associar o modelo a uma marca diferente.
        if ((int) $model->fleet_brand_id !== (int) $brandId) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'fleet_model_id' => 'O modelo selecionado não pertence à marca informada.',
            ]);
        }

        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(Fleet $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }
}
