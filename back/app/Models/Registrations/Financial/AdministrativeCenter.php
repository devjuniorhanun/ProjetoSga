<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Financial;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Producer;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\Farm;

/**
 * Classe AdministrativeCenter.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class AdministrativeCenter extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'administrative_centers';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo producer_id.
// Define o item atual da coleção ou configuração.
        'producer_id',
        // Permite o preenchimento do campo farm_id.
// Define o item atual da coleção ou configuração.
        'farm_id',
        // Permite o preenchimento do campo cei.
// Define o item atual da coleção ou configuração.
        'cei',
        // Permite o preenchimento do campo state_registration.
// Define o item atual da coleção ou configuração.
        'state_registration',
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
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
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

    // Define o relacionamento farm do modelo.
// Declara o método responsável por esta operação.
    public function farm()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Farm::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
