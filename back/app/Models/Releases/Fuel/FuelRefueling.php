<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelRefueling extends Model {
    protected $table='fuel_refuelings'; protected $fillable=['fuel_station_id','product_id','fleet_id','operator_id','fuel_registradora_id','refueled_at','quantity','unit_price','total_value','marking_type','meter_value','responsible_id','observation'];
    protected function casts(): array { return ['refueled_at'=>'datetime','quantity'=>'decimal:3','unit_price'=>'decimal:4','total_value'=>'decimal:2','meter_value'=>'decimal:2']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function fleet(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Vehicle\Fleet::class); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
