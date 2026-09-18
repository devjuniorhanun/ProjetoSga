<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ImpurityType extends Model
{
    use SoftDeletes;
    protected $table = 'grain_impurity_types';
    protected $fillable = ['name', 'code', 'measurement_unit', 'requires_destination', 'status', 'description'];
    protected function casts(): array { return ['requires_destination' => 'boolean']; }
}
