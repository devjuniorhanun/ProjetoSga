<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TechnicalLossConfig extends Model
{
    use SoftDeletes;
    protected $table = 'grain_technical_loss_configs';
    protected $fillable = ['producer_id', 'culture_id', 'monthly_percentage', 'effective_from', 'effective_until', 'status', 'created_by'];
    protected function casts(): array { return ['monthly_percentage' => 'decimal:5', 'effective_from' => 'date', 'effective_until' => 'date']; }
}
