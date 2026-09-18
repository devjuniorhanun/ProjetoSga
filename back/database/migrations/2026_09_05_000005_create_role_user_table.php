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
        Schema::create('role_user', function (Blueprint $table): void {
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
// Executa a instrução correspondente à regra ou operação atual.
            $table->primary(['role_id', 'user_id']);
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }

// Declara o método responsável por esta operação.
    public function down(): void
// Abre o bloco de código atual.
    {
// Remove a tabela durante o rollback.
        Schema::dropIfExists('role_user');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
