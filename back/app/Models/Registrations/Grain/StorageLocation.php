<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StorageLocation extends Model
{
    use SoftDeletes;
    protected $table = 'grain_storage_locations';
    protected $fillable = ['grain_warehouse_id', 'name', 'code', 'storage_type', 'capacity', 'status', 'notes'];
    protected function casts(): array { return ['capacity' => 'decimal:3']; }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class, 'grain_warehouse_id'); }
}
