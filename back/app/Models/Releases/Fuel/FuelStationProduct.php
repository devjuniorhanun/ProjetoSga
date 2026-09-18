<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelStationProduct extends Model {
    protected $table='fuel_station_products'; protected $fillable=['fuel_station_id','product_id','minimum_stock','maximum_stock','current_stock','status'];
    protected function casts(): array { return ['minimum_stock'=>'decimal:3','maximum_stock'=>'decimal:3','current_stock'=>'decimal:3']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
