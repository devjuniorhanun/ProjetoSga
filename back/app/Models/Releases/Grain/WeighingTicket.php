<?php

namespace App\Models\Releases\Grain;

use App\Models\Registrations\Grain\TransportTruck;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WeighingTicket extends Model
{
    public const ACTIVE_STATUSES = ['WAITING_FIRST_WEIGHT', 'FIRST_WEIGHED', 'WAITING_DISCOUNTS', 'WAITING_SECOND_WEIGHT', 'SECOND_WEIGHED', 'WAITING_AUTHORIZATION', 'READY_TO_CLOSE'];

    protected $table = 'grain_weighing_tickets';
    protected $guarded = [];
    protected function casts(): array { return ['first_weight_at' => 'datetime', 'second_weight_at' => 'datetime', 'closed_at' => 'datetime', 'canceled_at' => 'datetime', 'first_weight' => 'decimal:3', 'second_weight' => 'decimal:3', 'gross_weight' => 'decimal:3', 'tare_weight' => 'decimal:3', 'net_weight' => 'decimal:3', 'quality_discount_weight' => 'decimal:3', 'commercial_net_weight' => 'decimal:3']; }
    public function truck(): BelongsTo { return $this->belongsTo(TransportTruck::class, 'grain_transport_truck_id'); }
    public function discounts(): HasMany { return $this->hasMany(EntryDiscount::class, 'grain_weighing_ticket_id'); }
    public function allocations(): HasMany { return $this->hasMany(ShipmentAllocation::class, 'grain_weighing_ticket_id'); }
}
