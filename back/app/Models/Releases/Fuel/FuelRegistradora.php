<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class FuelRegistradora extends Model {
    protected $table='fuel_registradoras'; protected $fillable=['fuel_station_id','product_id','name','initial_reading','status'];
    protected function casts(): array { return ['initial_reading'=>'decimal:3']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
    public function readings(): HasMany { return $this->hasMany(FuelRegistradoraReading::class); }
}
