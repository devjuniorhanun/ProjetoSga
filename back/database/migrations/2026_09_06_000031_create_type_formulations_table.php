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
        Schema::create('type_formulations', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Armazena o campo formulation como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('formulation', 255);
            // Armazena o campo abbreviation como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('abbreviation', 255);
            // Armazena order como inteiro.
// Cria um campo inteiro.
            $table->integer('order');
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Impede duplicidade de formulation.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('formulation');
            // Impede duplicidade de abbreviation.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('abbreviation');
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
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
        Schema::dropIfExists('type_formulations');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
