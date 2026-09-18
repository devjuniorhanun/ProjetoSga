<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FleetMeterReading extends Model {
    protected $table='fleet_meter_readings'; protected $fillable=['fleet_id','reading_date','marking_type','initial_value','final_value','worked_value','responsible_id','observation'];
    protected function casts(): array { return ['reading_date'=>'date','initial_value'=>'decimal:2','final_value'=>'decimal:2','worked_value'=>'decimal:2']; }
    public function fleet(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Vehicle\Fleet::class); }
}
