<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class FuelTank extends Model {
    protected $table='fuel_tanks'; protected $fillable=['fuel_station_id','name','code','capacity','status','description'];
    protected function casts(): array { return ['capacity'=>'decimal:3']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function gaugeTable(): HasMany { return $this->hasMany(FuelTankGaugeTable::class); }
    public function gaugeReadings(): HasMany { return $this->hasMany(FuelTankGaugeReading::class); }
}
