<?php

// Define o namespace do recurso de referência anterior.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe a relação entre uma OS filha e uma OS anterior.
class AgriculturalDefensiveOrderPreviousOrderResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna os campos da relação.
        return [
            // ID da relação.
            'id' => $this->id,
            // ID da nova OS.
            'order_id' => $this->order_id,
            // ID da OS anterior.
            'previous_order_id' => $this->previous_order_id,
            // Número da OS anterior quando carregada.
            'previous_os_number' => $this->whenLoaded('previousOrder', fn () => $this->previousOrder->os_number),
            // Bombas usadas da OS anterior.
            'quantity_used' => $this->quantity_used,
        ];
    }
}
