<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Property\Areas;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\Farm;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\PlotField;
// Importa o model das ordens de serviço de defensivos.
use App\Models\Releases\Agricultural\Services\Defensive\AgriculturalDefensiveOrder;

/**
 * Classe Field.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class Field extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'fields';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo farm_id.
// Define o item atual da coleção ou configuração.
        'farm_id',
        // Permite o preenchimento do campo name.
// Define o item atual da coleção ou configuração.
        'name',
        // Permite o preenchimento do campo area.
// Define o item atual da coleção ou configuração.
        'area',
        // Permite o preenchimento do campo block.
// Define o item atual da coleção ou configuração.
        'block',
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
            // Converte area para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'area' => 'decimal:3',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento farm do modelo.
// Declara o método responsável por esta operação.
    public function farm()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Farm::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento plotFields do modelo.
// Declara o método responsável por esta operação.
    // Define as ordens de serviço de defensivos deste talhão.
    public function defensiveOrders()
    {
        // Uma OS pertence a um único talhão; o talhão pode ter várias OS.
        return $this->hasMany(AgriculturalDefensiveOrder::class, 'field_id');
    }

    // Define o relacionamento plotFields do modelo.
    public function plotFields()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasMany(PlotField::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
