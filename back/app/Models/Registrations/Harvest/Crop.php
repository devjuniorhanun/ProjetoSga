<?php

// Define o namespace do model de safras.
namespace App\Models\Registrations\Harvest;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;

// Representa uma safra agrícola no domínio.
class Crop extends Model
{
    // Habilita exclusão lógica.
    use SoftDeletes;

    // Define explicitamente a tabela.
    protected $table = 'crops';

    // Define os campos que podem ser preenchidos em massa.
    protected $fillable = [
        'agricultural_year_id',
        'name',
        'opening_date',
        'closing_date',
        'status',
    ];

    // Define a conversão automática dos campos.
    protected $casts = [
        'opening_date' => 'date:Y-m-d',
        'closing_date' => 'date:Y-m-d',
        'status' => 'string',
    ];

    // Relaciona a safra ao ano agrícola.
    public function agriculturalYear(): BelongsTo
    {
        return $this->belongsTo(AgriculturalYear::class);
    }

    // Relaciona a safra às culturas por meio da tabela pivô.
    public function cultures(): BelongsToMany
    {
        return $this->belongsToMany(
            Culture::class,
            'crop_culture',
        );
    }

    public function defensiveOrders(): HasMany
    {
        return $this->hasMany(AgriculturalDefensiveOrder::class, 'crop_id');
    }
}
