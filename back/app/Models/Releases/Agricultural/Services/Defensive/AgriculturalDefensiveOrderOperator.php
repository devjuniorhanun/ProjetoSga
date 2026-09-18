<?php

// Define o namespace do vínculo entre OS e operador.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
// Importa o model da OS.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
// Importa o model do operador.
use App\Models\Registrations\Agricultural\Defensive\AgriculturalOperator;
// Importa o model da frota.
use App\Models\Registrations\Vehicle\Fleet;

// Representa a participação de um operador em uma OS.
class AgriculturalDefensiveOrderOperator extends Model
{
    // Define a tabela do vínculo.
    protected $table = 'agricultural_defensive_order_operators';
    // Define os campos preenchíveis.
    protected $fillable = ['agricultural_defensive_order_id', 'operator_id', 'fleet_id', 'function'];
    // Define os relacionamentos.
    public function order(): BelongsTo
    {
        return $this->belongsTo(AgriculturalDefensiveOrder::class, 'agricultural_defensive_order_id');
    }
    // Define o operador.
    public function operator(): BelongsTo
    {
        return $this->belongsTo(AgriculturalOperator::class, 'operator_id');
    }
    // Define a frota.
    public function products(): HasMany
    {
        return $this->hasMany(AgriculturalDefensiveOrderOperatorProduct::class, 'agricultural_defensive_order_operator_id');
    }

    public function fleet(): BelongsTo
    {
        return $this->belongsTo(Fleet::class, 'fleet_id');
    }
}
