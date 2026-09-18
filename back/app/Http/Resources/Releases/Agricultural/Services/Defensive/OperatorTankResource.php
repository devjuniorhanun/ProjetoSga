<?php

// Define o namespace do recurso de tanque.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe o tanque diário do operador.
class OperatorTankResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna o tanque e seus produtos.
        return [
            // ID do tanque.
            'id' => $this->id,
            // Operador.
            'operator_id' => $this->operator_id,
            // Data.
            'date' => $this->date?->format('Y-m-d'),
            // Status.
            'status' => $this->status,
            // Produtos.
            'products' => OperatorTankProductResource::collection($this->whenLoaded('products')),
            // Operador carregado.
            'operator' => $this->whenLoaded('operator'),
        ];
    }
}
