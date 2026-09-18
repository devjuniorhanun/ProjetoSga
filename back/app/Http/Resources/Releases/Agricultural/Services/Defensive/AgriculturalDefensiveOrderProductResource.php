<?php

// Define o namespace do recurso de produto da OS.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base.
use Illuminate\Http\Resources\Json\JsonResource;

// Expõe o produto da OS.
class AgriculturalDefensiveOrderProductResource extends JsonResource
{
    // Monta a resposta.
    public function toArray($request): array
    {
        // Retorna os dados planejados e realizados.
        return [
            // ID interno.
            'id' => $this->id,
            // ID do produto.
            'product_id' => $this->product_id,
            'product_name' => $this->product->name,
            // Sequência canônica de adição ao tanque.
            'sequence' => $this->sequence,
            // Dose recomendada/histórica do produto.
            'dose' => round((float) $this->dose, 3),
            // Quantidade deste produto aplicada em uma bomba.
            'pump' => round((float) $this->pump, 3),
            // Bombas reais acumuladas do produto.
            'used_bomb' => round((float) $this->used_bomb, 3),
            // Quantidade recomendada calculada.
            'recommended_quantity' => round((float) $this->recommended_quantity, 3),
            // Quantidade realmente utilizada.
            'actual_quantity' => round((float) $this->actual_quantity, 3),
            // Dose real registrada.
            'actual_dose' => $this->actual_dose === null ? null : round((float) $this->actual_dose, 3),
            // Produto quando carregado.
            'product' => $this->whenLoaded('product'),
        ];
    }
}
