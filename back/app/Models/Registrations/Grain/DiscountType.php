<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DiscountType extends Model
{
    use SoftDeletes;
    protected $table = 'grain_discount_types';
    protected $fillable = ['culture_id', 'name', 'code', 'measurement_type', 'measurement_unit', 'calculation_method', 'affects_commercial_weight', 'generates_impurity', 'grain_impurity_type_id', 'display_order', 'status', 'description'];
    protected function casts(): array { return ['affects_commercial_weight' => 'boolean', 'generates_impurity' => 'boolean']; }
}
