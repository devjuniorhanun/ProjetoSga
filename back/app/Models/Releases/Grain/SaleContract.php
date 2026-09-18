<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SaleContract extends Model
{
    use SoftDeletes;
    protected $table = 'grain_sale_contracts';
    protected $guarded = [];
    protected function casts(): array { return ['contract_date' => 'date', 'start_date' => 'date', 'expiration_date' => 'date', 'contracted_weight' => 'decimal:3', 'tolerance_percentage' => 'decimal:5', 'transferred_weight' => 'decimal:3', 'shipped_weight' => 'decimal:3']; }
    public function allocations(): HasMany { return $this->hasMany(ShipmentAllocation::class, 'grain_sale_contract_id'); }
    public function availableWeight(): float { return max(0, (float) $this->transferred_weight - (float) $this->shipped_weight); }
}
