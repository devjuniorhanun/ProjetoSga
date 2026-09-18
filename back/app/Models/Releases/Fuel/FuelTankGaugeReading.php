<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelTankGaugeReading extends Model {
    protected $table='fuel_tank_gauge_readings'; protected $fillable=['fuel_tank_id','reading_at','centimeters','liters','responsible_id','observation'];
    protected function casts(): array { return ['reading_at'=>'datetime','centimeters'=>'decimal:2','liters'=>'decimal:3']; }
    public function tank(): BelongsTo { return $this->belongsTo(FuelTank::class,'fuel_tank_id'); }
}
