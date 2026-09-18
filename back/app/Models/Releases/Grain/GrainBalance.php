<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class GrainBalance extends Model
{
    protected $table = 'grain_balances';
    protected $guarded = [];
    protected function casts(): array { return ['physical_balance' => 'decimal:3', 'pending_impurity_weight' => 'decimal:3', 'commercial_balance' => 'decimal:3', 'contract_balance' => 'decimal:3', 'estimated_technical_reserve' => 'decimal:3']; }

    public function availableForContract(): float
    {
        $usablePhysical = (float) $this->physical_balance - (float) $this->pending_impurity_weight;
        $freeCommercial = (float) $this->commercial_balance - (float) $this->contract_balance - (float) $this->estimated_technical_reserve;
        return max(0, min($usablePhysical, $freeCommercial));
    }
}
