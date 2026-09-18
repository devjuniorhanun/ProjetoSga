<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;

class AuthorizationRequest extends Model
{
    protected $table = 'grain_authorization_requests';
    protected $fillable = ['request_number', 'operation_type', 'resource_type', 'resource_id', 'requested_by', 'requested_at', 'reason', 'payload_before', 'payload_requested', 'status', 'authorized_by', 'authorized_at', 'authorization_reason', 'rejection_reason', 'expires_at'];
    protected function casts(): array { return ['payload_before' => 'array', 'payload_requested' => 'array', 'requested_at' => 'datetime', 'authorized_at' => 'datetime', 'expires_at' => 'datetime']; }
}
