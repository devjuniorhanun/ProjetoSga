<?php

// Define o namespace do recurso de fechamento.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe um fechamento da OS.
class AgriculturalDefensiveOrderClosingResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna os dados do fechamento.
        return [
            // ID.
            'id' => $this->id,
            // OS.
            'agricultural_defensive_order_id' => $this->agricultural_defensive_order_id,
            // Tanque.
            'operator_tank_id' => $this->operator_tank_id,
            // Bombas deste evento.
            'closing_bomb' => $this->closing_bomb,
            // Tipo.
            'closing_type' => $this->closing_type,
            // Data/hora.
            'closed_at' => $this->closed_at?->toISOString(),
            // Usuário.
            'created_by' => $this->created_by,
            // Produtos efetivamente baixados neste evento.
            'products' => $this->whenLoaded('movements', function () {
                return $this->movements->map(fn ($movement) => [
                    'product_id' => $movement->product_id,
                    'product_name' => $movement->product?->name,
                    'quantity' => $movement->quantity,
                ])->values();
            }),
        ];
    }
}
