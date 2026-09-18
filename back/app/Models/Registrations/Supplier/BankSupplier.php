<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Supplier;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Supplier;

/**
 * Classe BankSupplier.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class BankSupplier extends Model
// Abre o bloco de código atual.
{
// Ativa o recurso SoftDeletes para preservar histórico.
// Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
// Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'bank_suppliers';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
// Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo supplier_id.
// Define o item atual da coleção ou configuração.
        'supplier_id',
        // Permite o preenchimento do campo supplier_name.
// Define o item atual da coleção ou configuração.
        'supplier_name',
        // Permite o preenchimento do campo bank_name.
// Define o item atual da coleção ou configuração.
        'bank_name',
        // Permite o preenchimento do campo agency_number.
// Define o item atual da coleção ou configuração.
        'agency_number',
        // Permite o preenchimento do campo account_number.
// Define o item atual da coleção ou configuração.
        'account_number',
        // Permite o preenchimento do campo operation_number.
// Define o item atual da coleção ou configuração.
        'operation_number',
        // Permite o preenchimento do campo pix_key.
// Define o item atual da coleção ou configuração.
        'pix_key',
        // Permite o preenchimento do campo account_type.
// Define o item atual da coleção ou configuração.
        'account_type',
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
            // Converte account_type para string.
// Garante que o valor recebido seja texto.
            'account_type' => 'string',
// Executa a instrução correspondente à regra ou operação atual.
        ];
// Fecha o bloco de código atual.
    }

    // Define o relacionamento supplier do modelo.
// Declara o método responsável por esta operação.
    public function supplier()
// Abre o bloco de código atual.
    {
// Retorna o resultado da operação atual.
        return $this->belongsTo(Supplier::class);
// Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
// Fecha o bloco de código atual.
}
