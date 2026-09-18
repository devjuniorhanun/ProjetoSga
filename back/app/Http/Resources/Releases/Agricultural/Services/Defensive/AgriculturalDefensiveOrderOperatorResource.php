<?php

// Define o namespace do recurso de operador.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe a participação do operador na OS.
class AgriculturalDefensiveOrderOperatorResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna os dados do vínculo.
        return [
            // ID do vínculo.
            'id' => $this->id,
            // ID do operador.
            'operator_id' => $this->operator_id,
            'operator_name' => $this->operator?->supplier?->fantasy_name,
            // ID da frota.
            'fleet_id' => $this->fleet_id,
            'fleet_name' => $this->fleet?->name,
            // Função.
            'function' => $this->function,
            // Operador carregado opcionalmente.
            'operator' => $this->whenLoaded('operator'),
            // Frota carregada opcionalmente.
            'fleet' => $this->whenLoaded('fleet'),
        ];
    }
}
