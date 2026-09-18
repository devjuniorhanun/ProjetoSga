<?php

// Define o namespace dos movimentos do tanque.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa o produto.
use App\Models\Registrations\Product\Product;

// Registra cada movimentação física de produto no tanque.
class OperatorTankMovement extends Model
{
    // Define a tabela.
    protected $table = 'operator_tank_movements';
    // Define os campos preenchíveis.
    protected $fillable = ['operator_tank_id', 'product_id', 'closing_id', 'order_id', 'movement_type', 'quantity', 'observation'];
    // Define o cast da quantidade.
    protected function casts(): array { return ['quantity' => 'decimal:3']; }
    // Relaciona ao tanque.
    public function tank(): BelongsTo { return $this->belongsTo(OperatorTank::class, 'operator_tank_id'); }
    // Relaciona ao produto.
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    // Relaciona ao fechamento.
    public function closing(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrderClosing::class, 'closing_id'); }
    // Relaciona à OS.
    public function order(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'order_id'); }
}
