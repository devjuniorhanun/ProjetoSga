<?php

// Define o namespace do recurso do produto do tanque.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe o saldo diário do produto no tanque.
class OperatorTankProductResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna o histórico resumido e o saldo atual.
        return [
            // ID.
            'id' => $this->id,
            // Produto.
            'product_id' => $this->product_id,
            // Saldo vindo do dia anterior.
            'opening_quantity' => round((float) $this->opening_quantity, 3),
            // Total retirado hoje.
            'withdrawn_quantity' => round((float) $this->withdrawn_quantity, 3),
            // Total usado hoje.
            'used_quantity' => round((float) $this->used_quantity, 3),
            // Total devolvido hoje.
            'returned_quantity' => round((float) $this->returned_quantity, 3),
            // Saldo atual.
            'current_quantity' => round((float) $this->current_quantity, 3),
            // Produto carregado.
            'product' => $this->whenLoaded('product'),
        ];
    }
}
