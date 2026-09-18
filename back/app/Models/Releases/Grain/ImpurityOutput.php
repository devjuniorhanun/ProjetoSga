<?php

namespace App\Models\Releases\Grain;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ImpurityOutput extends Model
{
    protected $table = 'grain_impurity_outputs';
    protected $guarded = [];
    public function items(): HasMany { return $this->hasMany(ImpurityOutputItem::class, 'grain_impurity_output_id'); }
}
