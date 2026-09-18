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
        Schema::create('cache', function (Blueprint $table) {
// Cria um campo de texto na estrutura da tabela.
            $table->string('key')->primary();
// Executa a instrução correspondente à regra ou operação atual.
            $table->mediumText('value');
// Cria um campo inteiro.
            $table->integer('expiration');
// Executa a instrução correspondente à regra ou operação atual.
        });
// Cria a tabela correspondente à entidade.
        Schema::create('cache_locks', function (Blueprint $table) {
// Cria um campo de texto na estrutura da tabela.
            $table->string('key')->primary();
// Cria um campo de texto na estrutura da tabela.
            $table->string('owner');
// Cria um campo inteiro.
            $table->integer('expiration');
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }
// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('cache_locks'); Schema::dropIfExists('cache'); }
// Fecha a definição atual.
};
