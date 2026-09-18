<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Supplier\Contracts;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Harvest\Crop;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Contracts\DriverContract;

/**
 * Classe DriversContracts.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class DriversContracts extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'drivers_contracts';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo crop_id.
// Define o item atual da coleção ou configuração.
        'crop_id',
        'contract_number', 'generation_batch', 'producer_id', 'supplier_id', 'bank_supplier_id',
        // Permite o preenchimento do campo opening_date.
// Define o item atual da coleção ou configuração.
        'opening_date',
        // Permite o preenchimento do campo closing_date.
// Define o item atual da coleção ou configuração.
        'closing_date',
        // Permite o preenchimento do campo shipping_cost.
// Define o item atual da coleção ou configuração.
        'shipping_cost',
        'calculation_basis', 'bag_weight', 'service_hours', 'extra_service_description', 'observations',
        'producer_snapshot', 'supplier_snapshot', 'participants_snapshot', 'bank_snapshot', 'contract_snapshot',
        'pdf_path', 'pdf_hash', 'generated_at', 'pdf_generated_at',
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
            // Converte shipping_cost para decimal:2.
// Define este campo ou configuração na estrutura atual.
            'shipping_cost' => 'decimal:2',
            'bag_weight' => 'decimal:3',
            'producer_snapshot' => 'array', 'supplier_snapshot' => 'array',
            'participants_snapshot' => 'array', 'bank_snapshot' => 'array', 'contract_snapshot' => 'array',
            'generated_at' => 'datetime', 'pdf_generated_at' => 'datetime',
            // Converte status para string.
// Garante que o valor recebido seja texto.
            'status' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
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

    // Define o relacionamento drivers do modelo.
// Declara o método responsável por esta operação.
    public function drivers()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->hasMany(DriverContract::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
