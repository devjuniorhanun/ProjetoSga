<?php

namespace App\Models\Releases\Harvest;

use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Harvest\Culture;
use App\Models\Registrations\Property\Owner;
use App\Models\Registrations\Property\Producer;
use App\Models\Registrations\Supplier\Warehouse;
use App\Models\Registrations\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HarvestGrainTransfer extends Model
{
    use SoftDeletes;

    protected $fillable = ['crop_id', 'producer_id', 'owner_id', 'warehouse_id', 'culture_id',
        'transfer_date', 'quantity_kg', 'quantity_bags', 'observation', 'status', 'created_by'];

    protected function casts(): array
    {
        return ['transfer_date' => 'date', 'quantity_kg' => 'decimal:3', 'quantity_bags' => 'decimal:3'];
    }

    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function producer(): BelongsTo { return $this->belongsTo(Producer::class); }
    public function owner(): BelongsTo { return $this->belongsTo(Owner::class); }
    public function warehouse(): BelongsTo { return $this->belongsTo(Warehouse::class); }
    public function culture(): BelongsTo { return $this->belongsTo(Culture::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
