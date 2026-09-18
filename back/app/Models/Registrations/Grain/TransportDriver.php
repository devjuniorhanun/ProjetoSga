<?php

namespace App\Models\Registrations\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransportDriver extends Model
{
    use SoftDeletes;
    protected $table = 'grain_transport_drivers';
    protected $fillable = ['name', 'cpf', 'phone', 'status', 'notes'];
}
