<?php
namespace App\Models\Releases\Fuel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class FuelTransfer extends Model {
    protected $table='fuel_transfers'; protected $fillable=['source_station_id','source_tank_id','destination_station_id','destination_tank_id','product_id','transfer_date','quantity','status','responsible_id','document_number','observation'];
    protected function casts(): array { return ['transfer_date'=>'datetime','quantity'=>'decimal:3']; }
    public function sourceStation(): BelongsTo { return $this->belongsTo(FuelStation::class,'source_station_id'); }
    public function destinationStation(): BelongsTo { return $this->belongsTo(FuelStation::class,'destination_station_id'); }
    public function product(): BelongsTo { return $this->belongsTo(\App\Models\Registrations\Product\Product::class); }
}
