<?php

// Define o namespace do produto do tanque.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa o produto cadastrado.
use App\Models\Registrations\Product\Product;

// Representa o saldo diário de um produto dentro do tanque.
class OperatorTankProduct extends Model
{
    // Define a tabela.
    protected $table = 'operator_tank_products';
    // Define os campos preenchíveis.
    protected $fillable = ['operator_tank_id', 'product_id', 'opening_quantity', 'withdrawn_quantity', 'used_quantity', 'returned_quantity', 'current_quantity'];
    // Define os casts decimais.
    protected function casts(): array { return ['opening_quantity' => 'decimal:3', 'withdrawn_quantity' => 'decimal:3', 'used_quantity' => 'decimal:3', 'returned_quantity' => 'decimal:3', 'current_quantity' => 'decimal:3']; }
    // Relaciona ao tanque.
    public function tank(): BelongsTo { return $this->belongsTo(OperatorTank::class, 'operator_tank_id'); }
    // Relaciona ao produto.
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
