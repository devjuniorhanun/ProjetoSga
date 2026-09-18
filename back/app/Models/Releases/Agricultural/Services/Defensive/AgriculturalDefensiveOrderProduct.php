<?php

// Define o namespace do produto da OS.
namespace App\Models\Releases\Agricultural\Services\Defensive;

// Importa o model base.
use Illuminate\Database\Eloquent\Model;
// Importa a relação belongsTo.
use Illuminate\Database\Eloquent\Relations\BelongsTo;
// Importa a OS.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;
// Importa o produto cadastrado.
use App\Models\Registrations\Product\Product;

// Representa um produto planejado e posteriormente realizado na OS.
class AgriculturalDefensiveOrderProduct extends Model
{
    // Define a tabela.
    protected $table = 'agricultural_defensive_order_products';
    // Define os campos preenchíveis.
    protected $fillable = ['agricultural_defensive_order_id', 'product_id', 'sequence', 'dose', 'pump', 'used_bomb', 'recommended_quantity', 'actual_quantity', 'actual_dose'];
    // Define os casts numéricos.
    protected function casts(): array { return ['sequence' => 'integer', 'dose' => 'decimal:3', 'pump' => 'decimal:3', 'used_bomb' => 'decimal:3', 'recommended_quantity' => 'decimal:3', 'actual_quantity' => 'decimal:3', 'actual_dose' => 'decimal:3']; }
    // Relaciona o item à OS.
    public function order(): BelongsTo { return $this->belongsTo(AgriculturalDefensiveOrder::class, 'agricultural_defensive_order_id'); }
    // Relaciona o item ao produto.
    public function product(): BelongsTo { return $this->belongsTo(Product::class); }
}
