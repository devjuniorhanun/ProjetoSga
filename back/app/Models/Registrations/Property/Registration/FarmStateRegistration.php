<?php

namespace App\Models\Registrations\Property\Registration;

use App\Models\Registrations\Property\Areas\Farm;
use App\Models\Registrations\Property\Producer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FarmStateRegistration extends Model
{
    use SoftDeletes;

    protected $fillable = ['producer_id', 'farm_id', 'state_registration', 'description', 'status'];
    protected $appends = ['producer_name', 'farm_name'];

    public function producer(): BelongsTo { return $this->belongsTo(Producer::class); }
    public function farm(): BelongsTo { return $this->belongsTo(Farm::class); }

    public function getProducerNameAttribute(): ?string
    {
        return $this->producer?->owner?->corporate_name;
    }

    public function getFarmNameAttribute(): ?string
    {
        return $this->farm?->name;
    }
}
