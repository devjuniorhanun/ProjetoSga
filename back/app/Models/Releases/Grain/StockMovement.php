<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $table = 'grain_stock_movements';
    protected $guarded = [];
    protected function casts(): array { return ['physical_quantity' => 'decimal:3', 'commercial_quantity' => 'decimal:3', 'occurred_at' => 'datetime']; }
}
