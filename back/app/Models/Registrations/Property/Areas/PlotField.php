<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Property\Areas;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Property\Areas\Field;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Harvest\Crop;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Harvest\Culture;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Harvest\VarietyCulture;

/**
 * Classe PlotField.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class PlotField extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'plot_fields';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo field_id.
// Define o item atual da coleção ou configuração.
        'field_id',
        'name',
        // Permite o preenchimento do campo crop_id.
// Define o item atual da coleção ou configuração.
        'crop_id',
        // Permite o preenchimento do campo culture_id.
// Define o item atual da coleção ou configuração.
        'culture_id',
        // Permite o preenchimento do campo variety_culture_id.
// Define o item atual da coleção ou configuração.
        'variety_culture_id',
        // Permite o preenchimento do campo area.
// Define o item atual da coleção ou configuração.
        'area',
        // Permite o preenchimento do campo pms.
// Define o item atual da coleção ou configuração.
        'pms',
        // Permite o preenchimento do campo linear_seed.
// Define o item atual da coleção ou configuração.
        'linear_seed',
        // Permite o preenchimento do campo start_planting.
// Define o item atual da coleção ou configuração.
        'start_planting',
        // Permite o preenchimento do campo final_planting.
// Define o item atual da coleção ou configuração.
        'final_planting',
        // Permite o preenchimento do campo expected_date.
// Define o item atual da coleção ou configuração.
        'expected_date',
        // Permite o preenchimento do campo observations.
// Define o item atual da coleção ou configuração.
        'observations',
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
            // Converte pms para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'pms' => 'decimal:3',
            // Converte linear_seed para decimal:3.
// Define este campo ou configuração na estrutura atual.
            'linear_seed' => 'decimal:3',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento field do modelo.
// Declara o método responsável por esta operação.
    public function field()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Field::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento crop do modelo.
// Declara o método responsável por esta operação.
    public function crop()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Crop::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento culture do modelo.
// Declara o método responsável por esta operação.
    public function culture()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Culture::class);
// Fecha o bloco de código atual.
    }

    // Define o relacionamento varietyCulture do modelo.
// Declara o método responsável por esta operação.
    public function varietyCulture()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(VarietyCulture::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
