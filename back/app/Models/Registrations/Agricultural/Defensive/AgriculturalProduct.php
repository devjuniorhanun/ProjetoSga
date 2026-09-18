<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Agricultural\Defensive;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Product\Product;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Agricultural\Defensive\TypeFormulation;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Agricultural\Defensive\ActiveIngredient;

/**
 * Classe AgriculturalProduct.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class AgriculturalProduct extends Model
// Abre o bloco de código atual.
{
    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
    // Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'agricultural_products';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
    // Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo product_id.
        // Define o item atual da coleção ou configuração.
        'product_id',
        // Permite o preenchimento do campo type_formulation_id.
        // Define o item atual da coleção ou configuração.
        'type_formulation_id',
        'status',
        // Executa a instrução correspondente à regra ou operação atual.
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
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

    // Define o relacionamento typeFormulation do modelo.
    // Declara o método responsável por esta operação.
    public function typeFormulation()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->belongsTo(TypeFormulation::class);
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento activeIngredients do modelo.
    // Declara o método responsável por esta operação.
    public function activeIngredients()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->hasMany(ActiveIngredient::class);
        // Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
    // Fecha o bloco de código atual.
}
