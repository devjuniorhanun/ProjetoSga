<?php

// Define o namespace do serviço de anos agrícolas.
namespace App\Services\Registrations\Harvest;

use App\Models\Registrations\Harvest\AgriculturalYear;
use Illuminate\Database\Eloquent\Collection;

// Centraliza as regras de negócio de anos agrícolas.
class AgriculturalYearService
{
    // Lista os anos mais recentes primeiro.
    public function list(): Collection
    {
        return AgriculturalYear::query()
            ->orderByDesc('opening_date')
            ->get();
    }

    // Cria um novo ano agrícola.
    public function create(array $data): AgriculturalYear
    {
        // Mantém A como valor padrão quando o cliente não informa status.
        return AgriculturalYear::create(
            $data + ['status' => $data['status'] ?? 'A'],
        );
    }

    // Atualiza um ano existente.
    public function update(
        AgriculturalYear $model,
        array $data,
    ): AgriculturalYear {
        // Aplica os dados já validados.
        $model->update($data);

        // Recarrega o model para retornar o estado atual do banco.
        return $model->refresh();
    }

    // Executa a exclusão lógica.
    public function delete(AgriculturalYear $model): void
    {
        $model->delete();
    }
}
