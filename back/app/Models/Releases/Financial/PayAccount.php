<?php

namespace App\Models\Releases\Financial;

use App\Models\Registrations\Financial\AdministrativeCenter;
use App\Models\Registrations\Financial\CostCenter;
use App\Models\Registrations\Financial\TypePayAccount;
use App\Models\Registrations\Harvest\Crop;
use App\Models\Registrations\Property\Producer;
use App\Models\Registrations\Supplier\Supplier;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PayAccount extends Model
{
    use SoftDeletes;

    public const ENTRY_ACCOUNT = 'ACCOUNT';
    public const ENTRY_PAYROLL = 'PAYROLL';
    public const ENTRY_HARVESTER_ADVANCE = 'HARVESTER_ADVANCE';
    public const ENTRY_TRANSPORTER_ADVANCE = 'TRANSPORTER_ADVANCE';

    protected $table = 'pay_accounts';

    protected $fillable = [
        'administrative_center_id',
        'cost_center_id',
        'supplier_id',
        'producer_id',
        'type_pay_account_id',
        'crop_id',
        'document_number',
        'document_date',
        'due_date',
        'description',
        'value',
        'accounted_for',
        'status',
        'entry_type',
        'source_type',
        'source_id',
    ];

    protected function casts(): array
    {
        return [
            'document_date' => 'date',
            'due_date' => 'date',
            'value' => 'decimal:2',
        ];
    }

    public function administrativeCenter(): BelongsTo
    {
        return $this->belongsTo(AdministrativeCenter::class);
    }

    public function costCenter(): BelongsTo
    {
        return $this->belongsTo(CostCenter::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function producer(): BelongsTo
    {
        return $this->belongsTo(Producer::class);
    }

    public function typePayAccount(): BelongsTo
    {
        return $this->belongsTo(TypePayAccount::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }
}
