<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelTankGaugeTable extends Model {
    protected $table='fuel_tank_gauge_tables'; protected $fillable=['fuel_tank_id','centimeters','liters'];
    protected function casts(): array { return ['centimeters'=>'decimal:2','liters'=>'decimal:3']; }
    public function tank(): BelongsTo { return $this->belongsTo(FuelTank::class,'fuel_tank_id'); }
}
