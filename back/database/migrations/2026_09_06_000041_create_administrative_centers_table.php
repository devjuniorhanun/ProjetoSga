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
        Schema::create('administrative_centers', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira producer_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira farm_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('farm_id')->constrained()->restrictOnDelete();
            // Armazena o campo cei como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('cei', 255)->nullable();
            // Armazena o campo state_registration como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('state_registration', 255)->nullable();
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
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
        Schema::dropIfExists('administrative_centers');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
