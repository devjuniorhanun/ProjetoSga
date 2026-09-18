<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class TechnicalLoss extends Model
{
    protected $table = 'grain_technical_losses';
    protected $guarded = [];
    protected function casts(): array { return ['daily_balance_snapshot' => 'array', 'configuration_snapshot' => 'array', 'processed_at' => 'datetime', 'reversed_at' => 'datetime']; }
}
