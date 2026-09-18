<?php

// Define o namespace do histórico de estoque.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa o produto.
use App\Models\Registrations\Product\Product;

// Registra todas as movimentações físicas do estoque de produtos.
class ProductStockMovement extends Model
{
    // Define a tabela.
    protected $table = 'product_stock_movements';
    // Define os campos preenchíveis.
    protected $fillable = ['product_id', 'order_id', 'operator_tank_id', 'movement_type', 'quantity', 'stock_before', 'stock_after', 'observation', 'created_by'];
    // Define os casts numéricos.
    protected function casts(): array { return ['quantity' => 'decimal:3', 'stock_before' => 'decimal:3', 'stock_after' => 'decimal:3']; }
    // Relaciona ao produto.
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
    // Relaciona à OS.
    public function order(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'order_id'); }
    // Relaciona ao tanque.
    public function operatorTank(): BelongsTo { return $this->belongsTo(OperatorTank::class, 'operator_tank_id'); }
}
