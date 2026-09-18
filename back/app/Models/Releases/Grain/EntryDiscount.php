<?php

namespace App\Models\Releases\Grain;

use App\Models\Registrations\Grain\DiscountType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EntryDiscount extends Model
{
    protected $table = 'grain_entry_discounts';
    protected $guarded = [];
    protected function casts(): array { return ['percentage' => 'decimal:5', 'discount_weight' => 'decimal:3', 'is_extra_discount' => 'boolean', 'calculation_snapshot' => 'array']; }
    public function discountType(): BelongsTo { return $this->belongsTo(DiscountType::class, 'grain_discount_type_id'); }
}
