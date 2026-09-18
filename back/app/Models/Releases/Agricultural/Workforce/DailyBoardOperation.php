<?php

namespace App\Models\Releases\Agricultural\Workforce;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailyBoardOperation extends Model
{
    use SoftDeletes;

    protected $fillable = ['daily_workforce_board_id', 'source_type', 'source_id', 'agricultural_service_type_id',
        'title', 'description', 'required_employees', 'display_order', 'status', 'source_snapshot'];
    protected $casts = ['source_snapshot' => 'array', 'required_employees' => 'integer', 'display_order' => 'integer'];
}
