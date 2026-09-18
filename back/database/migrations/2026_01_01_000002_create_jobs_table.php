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
        Schema::create('jobs', function (Blueprint $table) {
// Executa a instrução correspondente à regra ou operação atual.
            $table->bigIncrements('id');
// Cria um campo de texto na estrutura da tabela.
            $table->string('queue')->index();
// Executa a instrução correspondente à regra ou operação atual.
            $table->longText('payload');
// Executa a instrução correspondente à regra ou operação atual.
            $table->unsignedTinyInteger('attempts');
// Permite que este campo aceite valor nulo.
            $table->unsignedInteger('reserved_at')->nullable();
// Executa a instrução correspondente à regra ou operação atual.
            $table->unsignedInteger('available_at');
// Executa a instrução correspondente à regra ou operação atual.
            $table->unsignedInteger('created_at');
// Executa a instrução correspondente à regra ou operação atual.
        });
// Cria a tabela correspondente à entidade.
        Schema::create('job_batches', function (Blueprint $table) {
// Cria um campo de texto na estrutura da tabela.
            $table->string('id')->primary();
// Cria um campo de texto na estrutura da tabela.
            $table->string('name');
// Cria um campo inteiro.
            $table->integer('total_jobs');
// Cria um campo inteiro.
            $table->integer('pending_jobs');
// Cria um campo inteiro.
            $table->integer('failed_jobs');
// Executa a instrução correspondente à regra ou operação atual.
            $table->longText('failed_job_ids');
// Permite que este campo aceite valor nulo.
            $table->mediumText('options')->nullable();
// Cria um campo inteiro.
            $table->integer('cancelled_at')->nullable();
// Cria um campo inteiro.
            $table->integer('created_at');
// Cria um campo inteiro.
            $table->integer('finished_at')->nullable();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Cria a tabela correspondente à entidade.
        Schema::create('failed_jobs', function (Blueprint $table) {
// Cria a chave primária inteira com incremento automático.
            $table->id();
// Cria um campo de texto na estrutura da tabela.
            $table->string('uuid')->unique();
// Cria um campo de texto longo na estrutura da tabela.
            $table->text('connection');
// Cria um campo de texto longo na estrutura da tabela.
            $table->text('queue');
// Executa a instrução correspondente à regra ou operação atual.
            $table->longText('payload');
// Executa a instrução correspondente à regra ou operação atual.
            $table->longText('exception');
// Executa a instrução correspondente à regra ou operação atual.
            $table->timestamp('failed_at')->useCurrent();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }
// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('failed_jobs'); Schema::dropIfExists('job_batches'); Schema::dropIfExists('jobs'); }
// Fecha a definição atual.
};
