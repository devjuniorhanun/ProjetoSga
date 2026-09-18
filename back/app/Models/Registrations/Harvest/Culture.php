<?php

// Define o namespace do model de culturas.
namespace App\Models\Registrations\Harvest;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Registrations\Harvest\VarietyCulture;

// Representa uma cultura agrícola.
class Culture extends Model
{
    // Habilita exclusão lógica.
    use SoftDeletes;

    // Define a tabela utilizada pelo model.
    protected $table = 'cultures';

    // Define os campos permitidos para preenchimento em massa.
    protected $fillable = [
        'name',
        'status',
    ];

    // Converte status para string.
    protected $casts = [
        'status' => 'string',
    ];

    // Relaciona a cultura às suas variedades.
    public function varieties()
    {
        return $this->hasMany(VarietyCulture::class, 'culture_id');
    }

    // Relaciona culturas às safras.
    public function crops(): BelongsToMany
    {
        return $this->belongsToMany(
            Crop::class,
            'crop_culture',
        );
    }
}
