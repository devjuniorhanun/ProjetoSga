<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Property\Areas;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Owner;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Producer;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\Field;

/**
 * Classe Farm.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class Farm extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'farms';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo owner_id.
// Define o item atual da coleção ou configuração.
        'owner_id',
        // Permite o preenchimento do campo producer_id.
// Define o item atual da coleção ou configuração.
        'producer_id',
        // Permite o preenchimento do campo name.
// Define o item atual da coleção ou configuração.
        'name',
        // Permite o preenchimento do campo total_area.
// Define o item atual da coleção ou configuração.
        'total_area',
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
            // Converte total_area para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'total_area' => 'decimal:3',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento owner do modelo.
// Declara o método responsável por esta operação.
    public function owner()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Owner::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento producer do modelo.
// Declara o método responsável por esta operação.
    public function producer()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Producer::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento fields do modelo.
// Declara o método responsável por esta operação.
    public function fields()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasMany(Field::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
