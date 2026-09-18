<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelRegistradoraReading extends Model {
    protected $table='fuel_registradora_readings'; protected $fillable=['fuel_registradora_id','reading_date','start_reading','end_reading','quantity','responsible_id','observation'];
    protected function casts(): array { return ['reading_date'=>'date','start_reading'=>'decimal:3','end_reading'=>'decimal:3','quantity'=>'decimal:3']; }
    public function registradora(): BelongsTo { return $this->belongsTo(FuelRegistradora::class,'fuel_registradora_id'); }
}
