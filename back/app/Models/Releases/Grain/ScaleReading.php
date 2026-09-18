<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class ScaleReading extends Model
{
    protected $table = 'grain_scale_readings';
    protected $fillable = ['grain_scale_id', 'grain_scale_channel_id', 'node_code', 'sequence', 'weight', 'unit', 'stable', 'raw_message', 'read_at'];
    protected function casts(): array { return ['weight' => 'decimal:3', 'stable' => 'boolean', 'read_at' => 'datetime']; }
}
