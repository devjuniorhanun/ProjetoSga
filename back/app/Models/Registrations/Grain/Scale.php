<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Scale extends Model
{
    use SoftDeletes;
    protected $table = 'grain_scales';
    protected $fillable = ['name', 'code', 'manufacturer', 'model', 'serial_number', 'location', 'status', 'notes'];
    public function channels(): HasMany { return $this->hasMany(ScaleChannel::class, 'grain_scale_id'); }
}
