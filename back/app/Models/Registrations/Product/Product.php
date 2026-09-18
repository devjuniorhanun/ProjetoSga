<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Product;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\ProductGroup;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\SubGroupProduct;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\SupplierProduct;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Agricultural\Defensive\AgriculturalProduct;
// Importa o item de produto das ordens de defensivos.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrderProduct;
// Importa o item de produto dos tanques.
use App\Models\Releases\Agricultural\Services\Defensive\OperatorTankProduct;

/**
 * Classe Product.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class Product extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'products';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo product_group_id.
// Define o item atual da coleção ou configuração.
        'product_group_id',
        // Permite o preenchimento do campo sub_group_product_id.
// Define o item atual da coleção ou configuração.
        'sub_group_product_id',
        // Permite o preenchimento do campo name.
// Define o item atual da coleção ou configuração.
        'name',
        // Permite o preenchimento do campo stock.
// Define o item atual da coleção ou configuração.
        'stock',
        'reserved_stock',
        'average_cost',
        'stock_total_value',
        // Permite o preenchimento do campo stock_location.
// Define o item atual da coleção ou configuração.
        'stock_location',
        // Permite o preenchimento do campo minimum_quantity.
// Define o item atual da coleção ou configuração.
        'minimum_quantity',
        // Permite o preenchimento do campo drum_box.
// Define o item atual da coleção ou configuração.
        'drum_box',
        // Permite o preenchimento do campo gallon_package.
// Define o item atual da coleção ou configuração.
        'gallon_package',
        // Permite o preenchimento do campo unit.
// Define o item atual da coleção ou configuração.
        'unit',
        // Permite o preenchimento do campo status.
// Define o item atual da coleção ou configuração.
        'status',
// Executa a instrução correspondente à regra ou operação atual.
    ];

    // Converte automaticamente os atributos para os tipos esperados pela aplicação.
// Declara o método responsável por esta operação.
    protected function casts(): array
// Abre o bloco de código atual.
    {
        // Retorna o mapa de conversões do Eloquent.
// Retorna o resultado da operação atual.
        return [
            // Converte stock para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'stock' => 'decimal:3',
            'reserved_stock' => 'decimal:3',
            'average_cost' => 'decimal:6',
            'stock_total_value' => 'decimal:2',
            // Converte minimum_quantity para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'minimum_quantity' => 'decimal:3',
            // Converte drum_box para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'drum_box' => 'decimal:2',
            // Converte gallon_package para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'gallon_package' => 'decimal:2',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
            // Converte unit para string.
// Garante que o valor recebido seja texto.
            'unit' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento productGroup do modelo.
// Declara o método responsável por esta operação.
    public function productGroup()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(ProductGroup::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento subGroupProduct do modelo.
// Declara o método responsável por esta operação.
    public function subGroupProduct()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(SubGroupProduct::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento supplierProducts do modelo.
// Declara o método responsável por esta operação.
    public function supplierProducts()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasMany(SupplierProduct::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento agriculturalProduct do modelo.
// Declara o método responsável por esta operação.
    public function agriculturalProduct()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasOne(AgriculturalProduct::class);
// Fecha o bloco de código atual.
    }


    // Define as ocorrências do produto nas OS de defensivos.
    public function defensiveOrderProducts()
    {
        // Retorna todos os vínculos deste produto com OS.
        return $this->hasMany(AgriculturalDefensiveOrderProduct::class, 'product_id');
    }

    // Define os saldos deste produto nos tanques dos operadores.
    public function operatorTankProducts()
    {
        // Retorna todos os saldos do produto em tanques.
        return $this->hasMany(OperatorTankProduct::class, 'product_id');
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
