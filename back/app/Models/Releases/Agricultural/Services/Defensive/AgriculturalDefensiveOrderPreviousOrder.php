<?php

// Define o namespace da referência de OS anterior.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;

// Representa uma referência de uma nova OS para uma OS anterior.
class AgriculturalDefensiveOrderPreviousOrder extends Model
{
    // Define a tabela.
    protected $table = 'agricultural_defensive_order_previous_orders';
    // Define os campos preenchíveis.
    protected $fillable = ['order_id', 'previous_order_id', 'quantity_used'];
    // Define o cast da quantidade.
    protected function casts(): array { return ['quantity_used' => 'decimal:3']; }
    // Retorna a nova OS.
    public function order(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'order_id'); }
    // Retorna a OS anterior.
    public function previousOrder(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'previous_order_id'); }
}
