<?php

namespace App\Models\Releases\Agricultural\Workforce;

use Illuminate\Database\Eloquent\Model;

class EmployeeAllocationHistory extends Model
{
    public $timestamps = false;
    protected $fillable = ['daily_workforce_board_id', 'supplier_id', 'from_operation_id', 'to_operation_id',
        'action', 'save_version', 'changed_by', 'changed_at', 'snapshot'];
    protected $casts = ['changed_at' => 'datetime', 'snapshot' => 'array'];
}
