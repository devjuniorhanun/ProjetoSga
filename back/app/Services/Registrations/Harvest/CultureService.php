<?php

// Define o namespace do serviço de culturas.
namespace App\Services\Registrations\Harvest;

use App\Models\Registrations\Harvest\Culture;
use Illuminate\Database\Eloquent\Collection;

// Centraliza as regras de negócio de culturas.
class CultureService
{
    // Lista culturas em ordem alfabética.
    public function list(): Collection
    {
        return Culture::query()
            ->orderBy('name')
            ->get();
    }

    // Cria uma cultura.
    public function create(array $data): Culture
    {
        return Culture::create(
            $data + ['status' => $data['status'] ?? 'A'],
        );
    }

    // Atualiza uma cultura.
    public function update(Culture $model, array $data): Culture
    {
        $model->update($data);

        return $model->refresh();
    }

    // Executa a exclusão lógica.
    public function delete(Culture $model): void
    {
        $model->delete();
    }
}
