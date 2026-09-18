<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Agricultural\Defensive;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;

/**
 * Classe TypeFormulation.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class TypeFormulation extends Model
// Abre o bloco de código atual.
{
    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
    // Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'type_formulations';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
    // Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo formulation.
        // Define o item atual da coleção ou configuração.
        'formulation',
        // Permite o preenchimento do campo abbreviation.
        // Define o item atual da coleção ou configuração.
        'abbreviation',
        // Permite o preenchimento do campo order.
        // Define o item atual da coleção ou configuração.
        'order',
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
            // Converte order para integer.
            // Garante que o valor recebido seja inteiro.
            'order' => 'integer',
            // Converte status para string.
            // Garante que o valor recebido seja texto.
            'status' => 'string',
            // Executa a instrução correspondente à regra ou operação atual.
        ];
        // Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
    // Fecha o bloco de código atual.
}
