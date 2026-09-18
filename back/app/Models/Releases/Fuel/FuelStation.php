<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
class FuelStation extends Model {
    use SoftDeletes;
    protected $table='fuel_stations';
    protected $fillable=['name','code','station_type','status','description'];
    public function tanks(): HasMany { return $this->hasMany(FuelTank::class); }
    public function products(): HasMany { return $this->hasMany(FuelStationProduct::class); }
    public function registradoras(): HasMany { return $this->hasMany(FuelRegistradora::class); }
}
