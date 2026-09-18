<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FleetOilChange extends Model {
    protected $table='fleet_oil_changes'; protected $fillable=['fleet_id','product_id','change_date','marking_type','meter_value','quantity','next_meter_value','responsible_id','observation'];
    protected function casts(): array { return ['change_date'=>'date','meter_value'=>'decimal:2','quantity'=>'decimal:3','next_meter_value'=>'decimal:2']; }
    public function fleet(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Vehicle\Fleet::class); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
