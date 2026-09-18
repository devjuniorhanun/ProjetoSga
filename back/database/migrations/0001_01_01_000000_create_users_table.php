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
        Schema::create('users', function (Blueprint $table) {
// Cria a chave primária inteira com incremento automático.
            $table->id();
// Cria um campo de texto na estrutura da tabela.
            $table->string('name');
// Cria um campo de texto na estrutura da tabela.
            $table->string('email')->unique();
// Permite que este campo aceite valor nulo.
            $table->timestamp('email_verified_at')->nullable();
// Cria um campo de texto na estrutura da tabela.
            $table->string('password');
// Define o valor padrão utilizado quando o campo não for informado.
            $table->char('status', 1)->default('A')->index();
// Executa a instrução correspondente à regra ou operação atual.
            $table->rememberToken();
// Cria os campos created_at e updated_at.
            $table->timestamps();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('users'); }
// Fecha a definição atual.
};
