<?php

// Define o namespace do recurso da OS.
namespace App\Http\Resources\Releases\Agricultural\Services\Defensive;

// Importa a classe base de JsonResource.
use Illuminate\Http\Resources\Json\JsonResource;

// Transforma a OS em contrato JSON da API.
class AgriculturalDefensiveOrderResource extends JsonResource
{
    // Monta a resposta pública.
    public function toArray($request): array
    {
        // Retorna os campos e relações carregadas.
        return [
            // Identificador interno.
            'id' => $this->id,
            // Número público da OS.
            'os_number' => $this->os_number,
            // Identificador da OS pai.
            'parent_order_id' => $this->parent_order_id,
            // Talhão único da OS.
            'field_id' => $this->field_id,
            'field_name' => $this->field->name,
            // Área da OS.
            'area' => $this->area,
            // Safra.
            'crop_id' => $this->crop_id,
            'crop_name' => $this->crop->name,
            // Cultura.
            'culture_id' => $this->culture_id,
            'culture_name' => $this->culture->name,
            // Operação.
            'type_operation_id' => $this->type_operation_id,
            'type_operation_name' => $this->typeOperation->name,
            // Data.
            'application_date' => $this->application_date?->format('Y-m-d'),
            // Volume.
            'pump_volume' => $this->pump_volume,
            // Bombas recomendadas.
            'recommended_pump' => round((float) $this->recommended_pump, 3),
            // Vazão.
            'flow' => $this->flow,
            // Capacidade.
            'pump_capacity' => $this->pump_capacity,
            // Bombas realmente usadas acumuladas.
            'used_bomb' => round((float) $this->used_bomb, 3),
            // Observação operacional e rastreabilidade.
            'observation' => $this->observation,
            // Status.
            'status' => $this->status,
            // Talhão quando carregado.
            'field' => $this->whenLoaded('field'),
            // Produtos quando carregados.
            'products' => AgriculturalDefensiveOrderProductResource::collection($this->whenLoaded('products')),
            'operator_products' => \App\Http\Resources\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderOperatorProductResource::collection($this->whenLoaded('operatorProducts')),
            // Operadores quando carregados.
            'operators' => AgriculturalDefensiveOrderOperatorResource::collection($this->whenLoaded('operators')),
            // Fechamentos quando carregados.
            'closings' => AgriculturalDefensiveOrderClosingResource::collection($this->whenLoaded('closings')),
            // Filhas quando carregadas.
            'child_orders' => self::collection($this->whenLoaded('childOrders')),
            // Referências a ordens anteriores quando carregadas.
            'previous_orders' => AgriculturalDefensiveOrderPreviousOrderResource::collection($this->whenLoaded('previousOrders')),
            // Alias mantido para o contrato utilizado no formulário de edição.
            'previous_os' => AgriculturalDefensiveOrderPreviousOrderResource::collection($this->whenLoaded('previousOrders')),
            // Registra criação.
            'created_at' => $this->created_at?->toISOString(),
            // Registra atualização.
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
