<?php

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Migrations\Migration;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Schema\Blueprint;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Support\Facades\Schema;

// Retorna o resultado da operação atual.
return new class extends Migration
// Abre o bloco de código atual.
{
    // Cria a tabela da entidade.
// Declara o método responsável por esta operação.
    public function up(): void
// Abre o bloco de código atual.
    {
        // Abre a definição da tabela.
// Cria a tabela correspondente à entidade.
        Schema::create('bank_suppliers', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira supplier_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            // Armazena o campo supplier_name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('supplier_name', 255)->nullable();
            // Armazena o campo bank_name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('bank_name', 255)->nullable();
            // Armazena o campo agency_number como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('agency_number', 255)->nullable();
            // Armazena o campo account_number como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('account_number', 255)->nullable();
            // Armazena o campo operation_number como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('operation_number', 255)->nullable();
            // Armazena o campo pix_key como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('pix_key', 255)->nullable();
            // Armazena o campo account_type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('account_type', 1)->default('C');
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
            // Permite exclusão lógica.
// Cria o campo deleted_at para exclusão lógica.
            $table->softDeletes();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }

    // Remove a tabela em rollback.
// Declara o método responsável por esta operação.
    public function down(): void
// Abre o bloco de código atual.
    {
        // Executa a remoção somente se a tabela existir.
// Remove a tabela durante o rollback.
        Schema::dropIfExists('bank_suppliers');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
