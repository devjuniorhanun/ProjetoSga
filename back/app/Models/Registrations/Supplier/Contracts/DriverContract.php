<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Supplier\Contracts;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Contracts\DriversContracts;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Driver;

/**
 * Classe DriverContract.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class DriverContract extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'driver_contracts';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo drivers_contract_id.
// Define o item atual da coleção ou configuração.
        'drivers_contract_id',
        // Permite o preenchimento do campo driver_id.
// Define o item atual da coleção ou configuração.
        'driver_id',
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

    // Define o relacionamento contract do modelo.
// Declara o método responsável por esta operação.
    public function contract()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(DriversContracts::class, 'drivers_contract_id');
// Fecha o bloco de código atual.
    }

    // Define o relacionamento driver do modelo.
// Declara o método responsável por esta operação.
    public function driver()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Driver::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
