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
        Schema::create('personal_access_tokens', function (Blueprint $table) {
// Cria a chave primária inteira com incremento automático.
            $table->id();
// Executa a instrução correspondente à regra ou operação atual.
            $table->morphs('tokenable');
// Cria um campo de texto longo na estrutura da tabela.
            $table->text('name');
// Cria um campo de texto na estrutura da tabela.
            $table->string('token', 64)->unique();
// Cria um campo de texto longo na estrutura da tabela.
            $table->text('abilities')->nullable();
// Permite que este campo aceite valor nulo.
            $table->timestamp('last_used_at')->nullable();
// Permite que este campo aceite valor nulo.
            $table->timestamp('expires_at')->nullable()->index();
// Cria os campos created_at e updated_at.
            $table->timestamps();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }
// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('personal_access_tokens'); }
// Fecha a definição atual.
};
