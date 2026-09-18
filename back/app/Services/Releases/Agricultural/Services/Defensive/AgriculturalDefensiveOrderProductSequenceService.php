<?php

namespace App\Services\Releases\Agricultural\Services\Defensive;

use App\Models\Registrations\Agricultural\Defensive\AgriculturalProduct;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProduct;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Illuminate\Validation\ValidationException;

class AgriculturalDefensiveOrderProductSequenceService
{
    /**
     * Ordena o payload pela ordem da formulação e preserva a ordem manual
     * recebida entre produtos que pertencem ao mesmo grupo.
     */
    public function sortForCreation(array $products): array
    {
        $formulationOrders = $this->formulationOrders(collect($products)->pluck('product_id')->all());

        return collect($products)
            ->values()
            ->map(fn (array $product, int $index): array => [
                ...$product,
                '_input_sequence' => $index,
                '_formulation_order' => $formulationOrders[$product['product_id']],
            ])
            ->sortBy(fn (array $product): array => [
                $product['_formulation_order'],
                $product['_input_sequence'],
            ])
            ->values()
            ->map(function (array $product, int $index): array {
                unset($product['_input_sequence'], $product['_formulation_order']);
                $product['sequence'] = $index + 1;

                return $product;
            })
            ->all();
    }

    /**
     * Aplica uma ordem manual, sem permitir que um grupo de formulação
     * ultrapasse outro grupo com prioridade diferente.
     */
    public function reorder(AgriculturalDefensiveOrder $order, array $productIds): void
    {
        if ($order->status !== 'A') {
            throw new RuntimeException('Somente uma OS aberta pode ter seus produtos reordenados.');
        }

        $storedIds = $order->products()->pluck('product_id')->map(fn ($id): int => (int) $id)->sort()->values();
        $requestedIds = collect($productIds)->map(fn ($id): int => (int) $id);

        if ($storedIds->all() !== $requestedIds->sort()->values()->all()) {
            throw new RuntimeException('A nova sequência deve conter exatamente todos os produtos da OS.');
        }

        $formulationOrders = $this->formulationOrders($requestedIds->all());
        $lastOrder = null;

        foreach ($productIds as $productId) {
            $currentOrder = $formulationOrders[(int) $productId];
            if ($lastOrder !== null && $currentOrder < $lastOrder) {
                throw new RuntimeException('A ordem manual não pode desrespeitar a ordem dos tipos de formulação.');
            }
            $lastOrder = $currentOrder;
        }

        foreach ($productIds as $index => $productId) {
            $order->products()->where('product_id', $productId)->update(['sequence' => $index + 1]);
        }
    }

    /** Recalcula todas as OS abertas e mantém a ordem manual dentro dos empates. */
    public function resequenceOpenOrders(): void
    {
        AgriculturalDefensiveOrder::query()
            ->where('status', 'A')
            ->select('id')
            ->orderBy('id')
            ->chunkById(100, function (Collection $orders): void {
                foreach ($orders as $order) {
                    $this->resequenceOpenOrder($order);
                }
            });
    }

    private function resequenceOpenOrder(AgriculturalDefensiveOrder $order): void
    {
        $items = $order->products()->orderBy('sequence')->orderBy('id')->get();
        if ($items->isEmpty()) {
            return;
        }

        $formulationOrders = $this->formulationOrders($items->pluck('product_id')->all());
        $items = $items->sortBy(fn (AgriculturalDefensiveOrderProduct $item): array => [
            $formulationOrders[(int) $item->product_id],
            (int) $item->sequence,
            (int) $item->id,
        ])->values();

        foreach ($items as $index => $item) {
            if ((int) $item->sequence !== $index + 1) {
                $item->update(['sequence' => $index + 1]);
            }
        }
    }

    private function formulationOrders(array $productIds): array
    {
        $productIds = collect($productIds)->map(fn ($id): int => (int) $id)->unique()->values();

        $items = AgriculturalProduct::query()
            ->with('typeFormulation:id,order,status')
            ->whereIn('product_id', $productIds)
            ->where('status', 'A')
            ->get()
            ->keyBy('product_id');

        $orders = [];
        foreach ($productIds as $productId) {
            $agriculturalProduct = $items->get($productId);
            if (!$agriculturalProduct) {
                throw ValidationException::withMessages([
                    'products' => ["O produto {$productId} não possui cadastro agrícola ativo."],
                ]);
            }

            if (!$agriculturalProduct->typeFormulation || $agriculturalProduct->typeFormulation->status !== 'A') {
                throw ValidationException::withMessages([
                    'products' => ["O produto {$productId} não possui um tipo de formulação ativo."],
                ]);
            }

            $orders[$productId] = (int) $agriculturalProduct->typeFormulation->order;
        }

        return $orders;
    }
}
