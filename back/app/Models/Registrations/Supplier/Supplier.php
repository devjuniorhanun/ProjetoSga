<?php

// Define o namespace para organizar esta classe por domínio.
namespace App\Models\Registrations\Supplier;

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\Model;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Eloquent\SoftDeletes;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\TypeSupplier;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\BankSupplier;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Warehouse;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Driver;
// Importa uma dependência utilizada neste arquivo.
use App\Models\Registrations\Supplier\Lanyard;

/**
 * Classe Supplier.
 * Esta classe foi documentada para facilitar a manutenção do projeto.
 */
// Declara a classe responsável por esta parte do domínio.
class Supplier extends Model
// Abre o bloco de código atual.
{
    // Ativa o recurso SoftDeletes para preservar histórico.
    // Habilita a exclusão lógica dos registros deste modelo.
    use SoftDeletes;

    // Define explicitamente o nome da tabela quando queremos deixar o mapeamento evidente.
    // Define explicitamente o nome da tabela utilizada pelo Eloquent.
    protected $table = 'suppliers';

    // Lista os atributos que podem ser preenchidos em massa com segurança.
    // Define os atributos permitidos para preenchimento em massa.
    protected $fillable = [
        // Permite o preenchimento do campo corporate_reason.
        // Define o item atual da coleção ou configuração.
        'corporate_reason',
        // Permite o preenchimento do campo fantasy_name.
        // Define o item atual da coleção ou configuração.
        'fantasy_name',
        // Permite o preenchimento do campo type.
        // Define o item atual da coleção ou configuração.
        'type',
        // Permite o preenchimento do campo cpf_cnpj.
        // Define o item atual da coleção ou configuração.
        'cpf_cnpj',
        // Permite o preenchimento do campo rg_ie.
        // Define o item atual da coleção ou configuração.
        'rg_ie',
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
            // Converte type para string.
            // Garante que o valor recebido seja texto.
            'type' => 'string',
            // Executa a instrução correspondente à regra ou operação atual.
        ];
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento types do modelo.
    // Declara o método responsável por esta operação.
    public function types()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->belongsToMany(TypeSupplier::class, 'supplier_type_supplier');
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento bankSuppliers do modelo.
    // Declara o método responsável por esta operação.
    public function bankSuppliers()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->hasMany(BankSupplier::class);
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento warehouses do modelo.
    // Declara o método responsável por esta operação.
    public function warehouses()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->hasMany(Warehouse::class);
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento drivers do modelo.
    // Declara o método responsável por esta operação.
    public function drivers()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->hasMany(Driver::class);
        // Fecha o bloco de código atual.
    }

    // Define o relacionamento lanyards do modelo.
    // Declara o método responsável por esta operação.
    public function lanyards()
    // Abre o bloco de código atual.
    {
        // Retorna o resultado da operação atual.
        return $this->hasMany(Lanyard::class);
        // Fecha o bloco de código atual.
    }

    // Permite exclusão lógica sem apagar fisicamente o registro.
    // Fecha o bloco de código atual.
}
