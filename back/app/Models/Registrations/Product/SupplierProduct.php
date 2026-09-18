<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Product;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Supplier;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\Product;

/**
 * Classe SupplierProduct.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class SupplierProduct extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'supplier_products';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo supplier_id.
// Define o item atual da coleção ou configuração.
        'supplier_id',
        // Permite o preenchimento do campo product_id.
// Define o item atual da coleção ou configuração.
        'product_id',
        // Permite o preenchimento do campo product_code.
// Define o item atual da coleção ou configuração.
        'product_code',
        // Permite o preenchimento do campo volume.
// Define o item atual da coleção ou configuração.
        'volume',
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
            // Converte volume para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'volume' => 'decimal:2',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento supplier do modelo.
// Declara o método responsável por esta operação.
    public function supplier()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Supplier::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento product do modelo.
// Declara o método responsável por esta operação.
    public function product()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Product::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
