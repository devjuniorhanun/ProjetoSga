<?php

// Define o namespace do model de anos agrícolas.
namespace App\Models\Registrations\Harvest;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

// Representa um ano agrícola.
class AgriculturalYear extends Model
{
    // Habilita exclusão lógica.
    use SoftDeletes;

    // Define a tabela utilizada pelo model.
    protected $table = 'agricultural_years';

    // Campos permitidos para preenchimento em massa.
    protected $fillable = [
        'name',
        'opening_date',
        'closing_date',
        'status',
    ];

    // Converte datas e status automaticamente.
    protected $casts = [
        'opening_date' => 'date:Y-m-d',
        'closing_date' => 'date:Y-m-d',
        'status' => 'string',
    ];

    public function crops(): HasMany
    {
        return $this->hasMany(Crop::class);
    }
}
