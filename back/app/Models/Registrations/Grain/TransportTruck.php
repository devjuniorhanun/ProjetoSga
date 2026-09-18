<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransportTruck extends Model
{
    use SoftDeletes;
    protected $table = 'grain_transport_trucks';
    protected $fillable = ['license_plate', 'description', 'brand', 'model', 'color', 'maximum_gross_weight', 'status', 'notes'];
    protected function casts(): array { return ['maximum_gross_weight' => 'decimal:3']; }
}
