<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelEntry extends Model {
    protected $table='fuel_entries'; protected $fillable=['fuel_station_id','fuel_tank_id','product_id','supplier_id','entry_date','quantity','unit_price','total_value','invoice_number','status','responsible_id','observation'];
    protected function casts(): array { return ['entry_date'=>'date','quantity'=>'decimal:3','unit_price'=>'decimal:4','total_value'=>'decimal:2']; }
    public function station(): BelongsTo { return $this->belongsTo(FuelStation::class,'fuel_station_id'); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
