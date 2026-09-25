<?php

namespace App\Services\Releases\Inventory;

use App\Services\Shared\DocumentSequenceService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductStockService
{
    public function __construct(private readonly DocumentSequenceService $numbers) {}

    public function entry(array $data): int
    {
        return $this->move([...$data, 'quantity' => abs((float) $data['quantity'])]);
    }

    public function output(array $data): int
    {
        return $this->move([...$data, 'quantity' => -abs((float) $data['quantity'])]);
    }

    public function move(array $data): int
    {
        $quantity = round((float) $data['quantity'], 3);
        if ($quantity === 0.0) throw ValidationException::withMessages(['quantity' => ['A quantidade não pode ser zero.']]);
        $location = DB::table('stock_locations')->where('id', $data['stock_location_id'])->whereNull('deleted_at')->lockForUpdate()->first();
        if (!$location || $location->status !== 'A') {
            throw ValidationException::withMessages(['stock_location_id' => ['O local de estoque informado não está ativo.']]);
        }
        if ($quantity > 0 && $location->maximum_capacity !== null) {
            $locationBalance = (float) DB::table('product_stocks')->where('stock_location_id', $location->id)->sum('quantity');
            if (round($locationBalance + $quantity, 3) > (float) $location->maximum_capacity) {
                throw ValidationException::withMessages(['quantity' => ['A entrada ultrapassa a capacidade máxima do local de estoque.']]);
            }
        }
        $batch = (string) ($data['batch'] ?? '');
        $treatment = (string) ($data['treatment_status'] ?? 'NOT_APPLICABLE');
        $cultureId = $data['culture_id'] ?? null;
        $varietyId = $data['variety_culture_id'] ?? null;
        $sieve = filled($data['sieve'] ?? null) ? (string) $data['sieve'] : null;

        $stockQuery = DB::table('product_stocks')
            ->where('product_id', $data['product_id'])
            ->where('stock_location_id', $data['stock_location_id'])
            ->where('batch', $batch)
            ->where('treatment_status', $treatment);

        if (!empty($data['product_stock_id'])) {
            $stockQuery->where('id', $data['product_stock_id']);
        } else {
            $cultureId === null ? $stockQuery->whereNull('culture_id') : $stockQuery->where('culture_id', $cultureId);
            $varietyId === null ? $stockQuery->whereNull('variety_culture_id') : $stockQuery->where('variety_culture_id', $varietyId);
            $sieve === null ? $stockQuery->whereNull('sieve') : $stockQuery->where('sieve', $sieve);
        }

        $stock = $stockQuery->lockForUpdate()->first();
        if (!$stock) {
            if (!empty($data['product_stock_id']) || $quantity < 0) {
                throw ValidationException::withMessages(['product_stock_id' => ['A posição de estoque informada não foi encontrada.']]);
            }
            $id = DB::table('product_stocks')->insertGetId([
                'product_id' => $data['product_id'], 'stock_location_id' => $data['stock_location_id'], 'batch' => $batch,
                'culture_id' => $cultureId, 'variety_culture_id' => $varietyId, 'sieve' => $sieve,
                'manufacturing_date' => $data['manufacturing_date'] ?? null,
                'expiration_date' => $data['expiration_date'] ?? null, 'treatment_status' => $treatment,
                'quantity' => 0, 'reserved_quantity' => 0, 'average_cost' => 0, 'total_value' => 0,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $stock = DB::table('product_stocks')->where('id', $id)->lockForUpdate()->first();
        }
        $product = DB::table('products')->where('id', $data['product_id'])->lockForUpdate()->firstOrFail();
        $partialBefore = (float) $stock->quantity;
        $generalBefore = (float) $product->stock;
        $partialAfter = round($partialBefore + $quantity, 3);
        $generalAfter = round($generalBefore + $quantity, 3);
        if ($partialAfter < 0 || $generalAfter < 0) throw ValidationException::withMessages(['quantity' => ['Estoque insuficiente para esta movimentação.']]);

        $unitValue = round((float) ($data['unit_value'] ?? 0), 6);
        $newValue = $quantity > 0 ? round((float) $stock->total_value + ($quantity * $unitValue), 2) : round(max(0, (float) $stock->total_value - (abs($quantity) * (float) $stock->average_cost)), 2);
        $newAverage = $partialAfter > 0 ? round($newValue / $partialAfter, 6) : 0;
        DB::table('product_stocks')->where('id', $stock->id)->update(['quantity' => $partialAfter, 'average_cost' => $newAverage, 'total_value' => $newValue, 'updated_at' => now()]);

        $generalValue = (float) $product->stock_total_value + ($quantity > 0 ? $quantity * $unitValue : -abs($quantity) * (float) $product->average_cost);
        $generalValue = round(max(0, $generalValue), 2);
        DB::table('products')->where('id', $product->id)->update(['stock' => $generalAfter, 'stock_total_value' => $generalValue, 'average_cost' => $generalAfter > 0 ? round($generalValue / $generalAfter, 6) : 0, 'updated_at' => now()]);

        return DB::table('product_stock_movements')->insertGetId([
            'movement_number' => $this->numbers->next('MOV'), 'product_stock_id' => $stock->id,
            'product_id' => $product->id, 'stock_location_id' => $stock->stock_location_id,
            'movement_type' => $data['movement_type'], 'quantity' => $quantity, 'unit_value' => $unitValue,
            'total_value' => round(abs($quantity) * $unitValue, 2), 'partial_balance_before' => $partialBefore,
            'partial_balance_after' => $partialAfter, 'general_balance_before' => $generalBefore,
            'general_balance_after' => $generalAfter, 'source_type' => $data['source_type'], 'source_id' => $data['source_id'],
            'reason' => $data['reason'] ?? null, 'created_by' => $data['created_by'] ?? null,
            'occurred_at' => $data['occurred_at'] ?? now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
