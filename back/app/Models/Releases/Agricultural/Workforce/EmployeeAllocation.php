<?php

namespace App\Models\Releases\Agricultural\Workforce;

use Illuminate\Database\Eloquent\Model;

class EmployeeAllocation extends Model
{
    protected $fillable = ['daily_workforce_board_id', 'daily_board_operation_id', 'supplier_id',
        'display_order', 'notes', 'allocated_by', 'allocated_at'];
    protected $casts = ['allocated_at' => 'datetime', 'display_order' => 'integer'];
}
