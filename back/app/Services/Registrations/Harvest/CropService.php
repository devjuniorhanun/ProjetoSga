<?php

// Define o namespace do serviço de safras.
namespace App\Services\Registrations\Harvest;

use App\Models\Registrations\Harvest\Crop;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

// Centraliza as regras de negócio das safras.
class CropService
{
    // Lista safras carregando ano agrícola e culturas.
    public function list(): Collection
    {
        return Crop::with([
            'agriculturalYear',
            'cultures',
        ])
            ->orderByDesc('opening_date')
            ->get();
    }

    // Cria uma safra e sincroniza suas culturas.
    public function create(array $data): Crop
    {
        // Extrai a lista auxiliar porque ela não pertence diretamente à tabela crops.
        $cultureIds = $data['culture_ids'] ?? [];

        // Remove a lista antes do mass assignment do model.
        unset($data['culture_ids']);

        // Mantém a criação da safra e do relacionamento na mesma transação.
        return DB::transaction(function () use ($data, $cultureIds): Crop {
            // Cria a safra.
            $crop = Crop::create($data);

            // Sincroniza a tabela pivô crop_culture.
            $crop->cultures()->sync($cultureIds);

            // Retorna a safra já carregada com seus relacionamentos.
            return $crop->load([
                'agriculturalYear',
                'cultures',
            ]);
        });
    }

    // Atualiza uma safra e, quando enviado, suas culturas.
    public function update(Crop $crop, array $data): Crop
    {
        // Detecta se culture_ids foi realmente enviado.
        $cultureIds = array_key_exists('culture_ids', $data)
            ? $data['culture_ids']
            : null;

        // Remove o campo auxiliar do update da tabela crops.
        unset($data['culture_ids']);

        // Mantém atualização e sincronização atômicas.
        return DB::transaction(function () use (
            $crop,
            $data,
            $cultureIds,
        ): Crop {
            // Atualiza os campos da safra.
            $crop->update($data);

            // Só altera as culturas quando o campo foi enviado.
            if ($cultureIds !== null) {
                $crop->cultures()->sync($cultureIds);
            }

            // Retorna o estado atual do registro.
            return $crop->refresh()->load([
                'agriculturalYear',
                'cultures',
            ]);
        });
    }

    // Executa a exclusão lógica da safra.
    public function delete(Crop $crop): void
    {
        $crop->delete();
    }

    // Retorna as culturas de uma safra.
    public function cultures(Crop $crop): Collection
    {
        return $crop->cultures()
            ->orderBy('name')
            ->get();
    }
}
