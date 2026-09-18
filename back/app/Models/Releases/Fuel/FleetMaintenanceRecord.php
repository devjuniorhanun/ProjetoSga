<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FleetMaintenanceRecord extends Model {
    protected $table='fleet_maintenance_records'; protected $fillable=['fleet_id','maintenance_plan_id','maintenance_date','marking_type','meter_value','next_meter_value','cost','responsible_id','description'];
    protected function casts(): array { return ['maintenance_date'=>'date','meter_value'=>'decimal:2','next_meter_value'=>'decimal:2','cost'=>'decimal:2']; }
    public function fleet(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Vehicle\Fleet::class); }
    public function plan(): BelongsTo { return $this->belongsTo(FleetMaintenancePlan::class,'maintenance_plan_id'); }
}
