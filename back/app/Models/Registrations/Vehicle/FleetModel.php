<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Vehicle;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Vehicle\FleetBrand;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Vehicle\Fleet;

/**
 * Classe FleetModel.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class FleetModel extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'fleet_models';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo fleet_brand_id.
// Define o item atual da coleção ou configuração.
        'fleet_brand_id',
        // Permite o preenchimento do campo name.
// Define o item atual da coleção ou configuração.
        'name',
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

    // Define o relacionamento brand do modelo.
// Declara o método responsável por esta operação.
    public function brand()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(FleetBrand::class, 'fleet_brand_id');
// Fecha o bloco de código atual.
    }

    // Define o relacionamento fleets do modelo.
// Declara o método responsável por esta operação.
    public function fleets()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasMany(Fleet::class, 'fleet_model_id');
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
