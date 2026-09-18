<?php

// Define o namespace do model de variedades.
namespace App\Models\Registrations\Harvest;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

// Representa uma variedade vinculada a uma cultura.
class VarietyCulture extends Model
{
    // Habilita exclusão lógica.
    use SoftDeletes;

    // Define a tabela utilizada pelo model.
    protected $table = 'variety_cultures';

    // Define os campos permitidos para preenchimento em massa.
    protected $fillable = [
        'culture_id',
        'name',
        'technology',
        'cycle',
        'flowering_days',
        'status',
    ];

    // Converte os atributos para os tipos esperados.
    protected $casts = [
        'flowering_days' => 'integer',
        'status' => 'string',
    ];

    // Relaciona a variedade à sua cultura.
    public function culture(): BelongsTo
    {
        return $this->belongsTo(Culture::class);
    }
}
