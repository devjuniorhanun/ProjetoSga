<?php

namespace App\Models\Releases\Agricultural\Workforce;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DailyWorkforceBoard extends Model
{
    use SoftDeletes;

    protected $fillable = ['work_date', 'version', 'notes', 'status', 'created_by', 'updated_by'];
    protected $casts = ['work_date' => 'date', 'version' => 'integer'];
}
