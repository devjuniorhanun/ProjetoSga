<?php

namespace App\Models\Releases\Agricultural\Services\Defensive;

use App\Models\Registrations\Product\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperatorTankWithdrawalItem extends Model
{
    protected $fillable = ['operator_tank_withdrawal_id', 'product_id', 'quantity', 'stock_before', 'stock_after', 'tank_balance_before', 'tank_balance_after', 'product_stock_movement_id', 'operator_tank_movement_id'];
    protected function casts(): array { return ['quantity' => 'decimal:3', 'stock_before' => 'decimal:3', 'stock_after' => 'decimal:3', 'tank_balance_before' => 'decimal:3', 'tank_balance_after' => 'decimal:3']; }
    public function withdrawal(): BelongsTo { return $this->belongsTo(OperatorTankWithdrawal::class, 'operator_tank_withdrawal_id'); }
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
