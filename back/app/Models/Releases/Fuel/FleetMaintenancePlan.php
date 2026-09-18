<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class FleetMaintenancePlan extends Model {
    protected $table='fleet_maintenance_plans'; protected $fillable=['fleet_id','name','marking_type','interval_value','base_meter_value','status'];
    protected function casts(): array { return ['interval_value'=>'decimal:2','base_meter_value'=>'decimal:2']; }
    public function fleet(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Vehicle\Fleet::class); }
    public function records(): HasMany { return $this->hasMany(FleetMaintenanceRecord::class,'maintenance_plan_id'); }
}
