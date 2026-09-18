<?php

namespace App\Models\Releases\Agricultural\Services\Defensive;

use App\Models\Registrations\Admin\User;
use App\Models\Registrations\Harvest\Crop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OperatorTankWithdrawal extends Model
{
    protected $fillable = ['withdrawal_number', 'crop_id', 'operator_tank_id', 'cutoff_date', 'occurred_at', 'observation', 'created_by', 'status'];
    protected function casts(): array { return ['cutoff_date' => 'date', 'occurred_at' => 'datetime']; }
    public function crop(): BelongsTo { return $this->belongsTo(Crop::class); }
    public function tank(): BelongsTo { return $this->belongsTo(OperatorTank::class, 'operator_tank_id'); }
    public function items(): HasMany { return $this->hasMany(OperatorTankWithdrawalItem::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
