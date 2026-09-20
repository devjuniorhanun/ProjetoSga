<?php

namespace App\Models\Releases\Harvest;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class HarvestRelease extends Model
{
    use SoftDeletes;

    protected $fillable = ['crop_id','driver_id','owner_id','farm_state_registration_id','plot_field_id','warehouse_id','lanyard_id','matrix_freight_id','release_date','shipping_number','control_number','gross_weight','discount_weight','discount','net_weight','liquid_bags','gross_bags','shipping_value','status','created_by'];

    protected function casts(): array
    {
        return ['release_date'=>'date','gross_weight'=>'decimal:3','discount_weight'=>'decimal:3','discount'=>'decimal:4','net_weight'=>'decimal:3','liquid_bags'=>'decimal:3','gross_bags'=>'decimal:2','shipping_value'=>'decimal:2'];
    }
}
