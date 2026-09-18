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
        Schema::create('warehouses', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira supplier_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            // Armazena o campo name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('name', 255);
            // Armazena o campo city como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('city', 255);
            // Armazena o campo type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('type', 1)->default('P');
            // Armazena o código route com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('route', 1);
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Impede duplicidade do campo name.
// Cria uma restrição para impedir valores duplicados.
            $table->unique('name');
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
        Schema::dropIfExists('warehouses');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
