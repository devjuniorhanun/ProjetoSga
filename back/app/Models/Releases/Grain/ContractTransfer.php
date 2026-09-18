<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class ContractTransfer extends Model
{
    protected $table = 'grain_contract_transfers';
    protected $guarded = [];
    protected function casts(): array { return ['weight' => 'decimal:3', 'confirmed_at' => 'datetime', 'canceled_at' => 'datetime']; }
}
