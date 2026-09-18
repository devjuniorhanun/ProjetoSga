<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelStockMovement extends Model {
    protected $table='fuel_stock_movements'; protected $fillable=['fuel_station_id','product_id','fuel_tank_id','movement_type','direction','quantity','stock_before','stock_after','unit_cost','total_cost','reference_type','reference_id','responsible_id','observation'];
    protected function casts(): array { return ['quantity'=>'decimal:3','stock_before'=>'decimal:3','stock_after'=>'decimal:3','unit_cost'=>'decimal:4','total_cost'=>'decimal:2']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
