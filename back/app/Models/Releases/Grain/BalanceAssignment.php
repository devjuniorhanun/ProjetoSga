<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class BalanceAssignment extends Model
{
    protected $table = 'grain_balance_assignments';
    protected $guarded = [];
    protected function casts(): array { return ['weight' => 'decimal:3', 'confirmed_at' => 'datetime']; }
}
