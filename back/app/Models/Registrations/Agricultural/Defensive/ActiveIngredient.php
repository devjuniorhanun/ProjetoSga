<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Agricultural\Defensive;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Agricultural\Defensive\AgriculturalProduct;

/**
 * Classe ActiveIngredient.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class ActiveIngredient extends Model
// Abre o bloco de código atual.
{
// Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'active_ingredients';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo agricultural_product_id.
// Define o item atual da coleção ou configuração.
        'agricultural_product_id',
        // Permite o preenchimento do campo active_ingredient.
// Define o item atual da coleção ou configuração.
        'active_ingredient',
        // Permite o preenchimento do campo concentration.
// Define o item atual da coleção ou configuração.
        'concentration',
// Executa a instrução correspondente à regra ou operação atual.
    ];

    // Define o relacionamento agriculturalProduct do modelo.
// Declara o método responsável por esta operação.
    public function agriculturalProduct()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(AgriculturalProduct::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
