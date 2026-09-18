<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes;
    protected $table = 'grain_warehouses';
    protected $fillable = ['name', 'code', 'producer_id', 'address', 'status', 'notes'];
    public function storageLocations(): HasMany { return $this->hasMany(StorageLocation::class, 'grain_warehouse_id'); }
}
