<?php

namespace App\Services\Registrations\Property\Areas;

use Illuminate\Validation\ValidationException;
use App\Models\Registrations\Harvest\VarietyCulture;
use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Property\Areas\PlotField;
use App\Models\Registrations\Property\Areas\Field;



/**
 * Classe PlotFieldService.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
class PlotFieldService {
// Lista registros ordenados pelo nome ou pela chave primária.
    public function list()
    {
        // Carrega relacionamentos para evitar consultas desnecessárias no Resource.
        return PlotField::query()->with(['field','crop','culture','varietyCulture'])
            ->orderBy('name')->orderBy('id')->get();
    }

    // Cria um novo registro com os dados previamente validados.
    public function create(array $data): PlotField
    {
        // Busca a variedade selecionada.
        $variety = VarietyCulture::findOrFail($data['variety_culture_id']);

        // Confere se a variedade pertence à cultura informada.
        if ((int) $variety->culture_id !== (int) $data['culture_id']) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'variety_culture_id' => 'A variedade selecionada não pertence à cultura informada.',
            ]);
        }

        // Busca a safra selecionada.
        $crop = Crop::findOrFail($data['crop_id']);

        // Confere se a cultura está vinculada à safra.
        if (! $crop->cultures()->whereKey($data['culture_id'])->exists()) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'culture_id' => 'A cultura selecionada não está vinculada à safra informada.',
            ]);
        }

        $this->validateArea($data);

        // Persiste os dados no banco.
        return PlotField::create($data);
    }

    // Atualiza um registro existente.
    public function update(PlotField $item, array $data): PlotField
    {
        // Define os valores finais da edição.
        $cultureId = $data['culture_id'] ?? $item->culture_id;
        // Define a variedade final.
        $varietyId = $data['variety_culture_id'] ?? $item->variety_culture_id;
        // Define a safra final.
        $cropId = $data['crop_id'] ?? $item->crop_id;
        // Busca a variedade final.
        $variety = VarietyCulture::findOrFail($varietyId);

        // Impede que a variedade seja associada a outra cultura.
        if ((int) $variety->culture_id !== (int) $cultureId) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'variety_culture_id' => 'A variedade selecionada não pertence à cultura informada.',
            ]);
        }

        // Busca a safra final.
        $crop = Crop::findOrFail($cropId);

        // Impede utilizar uma cultura que não pertence à safra.
        if (! $crop->cultures()->whereKey($cultureId)->exists()) {
            throw ValidationException::withMessages([
                // Informa a inconsistência encontrada.
                'culture_id' => 'A cultura selecionada não está vinculada à safra informada.',
            ]);
        }

        $this->validateArea([
            'field_id' => $data['field_id'] ?? $item->field_id,
            'crop_id' => $cropId,
            'area' => $data['area'] ?? $item->area,
        ], $item->id);

        // Aplica as alterações.
        $item->update($data);

        // Retorna a instância atualizada.
        return $item->refresh();
    }

    // Remove logicamente o registro.
    public function delete(PlotField $item): void
    {
        // Executa SoftDeletes.
        $item->delete();
    }

    private function validateArea(array $data, ?int $exceptId = null): void
    {
        if (! isset($data['area'])) {
            return;
        }
        $field = Field::findOrFail($data['field_id']);
        $used = (float) PlotField::query()->where('crop_id', $data['crop_id'])
            ->where('field_id', $data['field_id'])
            ->when($exceptId, fn ($query, $id) => $query->where('id', '<>', $id))->sum('area');
        $available = round((float) $field->area - $used, 3);
        if ((float) $data['area'] > $available + 0.0005) {
            throw ValidationException::withMessages([
                'area' => 'A área informada excede a área livre de '.number_format(max(0, $available), 3, ',', '.').' ha do talhão.',
            ]);
        }
    }
}
