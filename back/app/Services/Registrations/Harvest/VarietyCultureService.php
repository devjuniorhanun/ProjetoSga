<?php

// Define o namespace do serviço de variedades.
namespace App\Services\Registrations\Harvest;

use App\Models\Registrations\Harvest\VarietyCulture;
use Illuminate\Database\Eloquent\Collection;

// Centraliza as regras de negócio das variedades.
class VarietyCultureService
{
    // Lista variedades carregando a cultura relacionada.
    public function list(): Collection
    {
        return VarietyCulture::with('culture')
            ->orderBy('name')
            ->get();
    }

    // Lista somente as variedades de uma cultura.
    public function byCulture(string $cultureId): Collection
    {
        return VarietyCulture::with('culture')
            ->where('culture_id', $cultureId)
            ->orderBy('name')
            ->get();
    }

    // Cria uma variedade.
    public function create(array $data): VarietyCulture
    {
        return VarietyCulture::create(
            $data + ['status' => $data['status'] ?? 'A'],
        )->load('culture');
    }

    // Atualiza uma variedade.
    public function update(
        VarietyCulture $model,
        array $data,
    ): VarietyCulture {
        $model->update($data);

        return $model->refresh()->load('culture');
    }

    // Executa a exclusão lógica.
    public function delete(VarietyCulture $model): void
    {
        $model->delete();
    }
}
