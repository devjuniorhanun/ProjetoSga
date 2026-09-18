<?php

namespace App\Models\Releases\Agricultural\Services\Defensive;

use App\Models\Registrations\Product\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgriculturalDefensiveOrderOperatorProduct extends Model
{
    protected $table = 'agricultural_defensive_order_operator_products';

    protected $fillable = [
        'agricultural_defensive_order_id',
        'agricultural_defensive_order_operator_id',
        'product_id',
        'dose',
        'pump',
        'area',
        'planned_quantity',
    ];

    protected function casts(): array
    {
        return [
            'dose' => 'decimal:3',
            'pump' => 'decimal:3',
            'area' => 'decimal:3',
            'planned_quantity' => 'decimal:3',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(AgriculturalDefensiveOrder::class, 'agricultural_defensive_order_id');
    }

    public function orderOperator(): BelongsTo
    {
        return $this->belongsTo(AgriculturalDefensiveOrderOperator::class, 'agricultural_defensive_order_operator_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
