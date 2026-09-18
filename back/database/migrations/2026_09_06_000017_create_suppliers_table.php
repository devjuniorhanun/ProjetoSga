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
        Schema::create('suppliers', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Armazena o campo corporate_reason como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('corporate_reason', 255);
            // Armazena o campo fantasy_name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('fantasy_name', 255);
            // Armazena o campo type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('type', 1)->default('F');
            // Armazena o campo cpf_cnpj como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('cpf_cnpj', 255)->nullable();
            // Armazena o campo rg_ie como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('rg_ie', 255)->nullable();
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Impede duplicidade de corporate_reason.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('corporate_reason');
            // Impede duplicidade de fantasy_name.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('fantasy_name');
            // Impede duplicidade de cpf_cnpj.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('cpf_cnpj');
            // Impede duplicidade de rg_ie.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('rg_ie');
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
        Schema::dropIfExists('suppliers');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
