<?php

// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Migrations\Migration;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Schema\Blueprint;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Support\Facades\Schema;

// Retorna o resultado da operação atual.
return new class extends Migration {
// Declara o método responsável por esta operação.
    public function up(): void
// Abre o bloco de código atual.
    {
// Cria a tabela correspondente à entidade.
        Schema::create('roles', function (Blueprint $table): void {
// Cria a chave primária inteira com incremento automático.
            $table->id();
// Cria um campo de texto na estrutura da tabela.
            $table->string('name', 100)->unique();
// Cria um campo de texto na estrutura da tabela.
            $table->string('abbreviation', 20)->unique();
// Define o valor padrão utilizado quando o campo não for informado.
            $table->char('status', 1)->default('A');
// Cria os campos created_at e updated_at.
            $table->timestamps();
// Executa a instrução correspondente à regra ou operação atual.
            $table->index('status');
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function down(): void
// Abre o bloco de código atual.
    {
// Remove a tabela durante o rollback.
        Schema::dropIfExists('roles');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
