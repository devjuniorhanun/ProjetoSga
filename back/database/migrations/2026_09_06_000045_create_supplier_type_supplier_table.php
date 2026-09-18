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
    // Cria a tabela intermediária do relacionamento N:N.
// Declara o método responsável por esta operação.
    public function up(): void
// Abre o bloco de código atual.
    {
        // Define a tabela pivô.
// Cria a tabela correspondente à entidade.
        Schema::create('supplier_type_supplier', function (Blueprint $table): void {
            // Cria a chave primária técnica da tabela pivô.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a primeira chave estrangeira.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('supplier_id')->constrained()->cascadeOnDelete();
            // Cria a segunda chave estrangeira.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('type_supplier_id')->constrained()->cascadeOnDelete();
            // Impede duplicação do mesmo par de relacionamento.
// Cria uma restrição para impedir valores duplicados.
            $table->unique(['supplier_id', 'type_supplier_id']);
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }

    // Remove a tabela pivô durante rollback.
// Declara o método responsável por esta operação.
    public function down(): void
// Abre o bloco de código atual.
    {
        // Exclui a tabela se ela existir.
// Remove a tabela durante o rollback.
        Schema::dropIfExists('supplier_type_supplier');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
