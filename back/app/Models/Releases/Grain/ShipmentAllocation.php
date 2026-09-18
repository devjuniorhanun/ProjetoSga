<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class ShipmentAllocation extends Model
{
    protected $table = 'grain_shipment_allocations';
    protected $guarded = [];
    protected function casts(): array { return ['allocated_weight' => 'decimal:3']; }
}
