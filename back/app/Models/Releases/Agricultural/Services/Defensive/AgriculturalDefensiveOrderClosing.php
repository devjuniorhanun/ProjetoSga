<?php

// Define o namespace dos fechamentos.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Representa um fechamento parcial ou final de uma OS.
class AgriculturalDefensiveOrderClosing extends Model
{
    // Define a tabela.
    protected $table = 'agricultural_defensive_order_closings';
    // Define os campos preenchíveis.
    protected $fillable = ['agricultural_defensive_order_id', 'operator_tank_id', 'closing_bomb', 'closing_type', 'closed_at', 'created_by'];
    // Define casts de quantidade e data.
    protected function casts(): array { return ['closing_bomb' => 'decimal:3', 'closed_at' => 'datetime']; }
    // Relaciona ao pedido.
    public function order(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'agricultural_defensive_order_id'); }
    // Relaciona ao tanque.
    public function operatorTank(): BelongsTo { return $this->belongsTo(OperatorTank::class); }
    public function movements(): HasMany { return $this->hasMany(OperatorTankMovement::class, 'closing_id'); }
}
