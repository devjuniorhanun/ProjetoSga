<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ScaleChannel extends Model
{
    use SoftDeletes;
    protected $table = 'grain_scale_channels';
    protected $fillable = ['grain_scale_id', 'code', 'description', 'maximum_weight', 'minimum_weight', 'division_weight', 'unit', 'serial_configuration', 'status'];
    protected function casts(): array { return ['maximum_weight' => 'decimal:3', 'minimum_weight' => 'decimal:3', 'division_weight' => 'decimal:3', 'serial_configuration' => 'array']; }
    public function scale(): BelongsTo { return $this->belongsTo(Scale::class, 'grain_scale_id'); }
}
