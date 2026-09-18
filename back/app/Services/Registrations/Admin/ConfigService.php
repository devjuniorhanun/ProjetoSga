<?php

// Define o namespace do serviço administrativo.
namespace App\Services\Registrations\Admin;

use App\Models\Registrations\Admin\Config;
use Illuminate\Database\Eloquent\Collection;

// Centraliza as regras de negócio das configurações.
class ConfigService
{
    // Lista configurações ordenadas por produtor e propriedade.
    public function list(): Collection
    {
        return Config::query()
            ->orderBy('producer_name')
            ->orderBy('property_name')
            ->get();
    }

    // Cria uma configuração.
    public function create(array $data): Config
    {
        // Aplica o status padrão da aplicação.
        $data['status'] = $data['status'] ?? 'A';

        // Persiste somente os dados validados.
        return Config::create($data);
    }

    // Atualiza uma configuração.
    public function update(Config $config, array $data): Config
    {
        $config->update($data);

        return $config->refresh();
    }

    // Executa a exclusão lógica.
    public function delete(Config $config): void
    {
        $config->delete();
    }
}
