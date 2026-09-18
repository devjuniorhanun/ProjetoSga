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
        Schema::create('matrix_freights', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira crop_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            // Armazena o código block com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('block', 1);
            // Armazena o código route com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('route', 1);
            // Armazena price com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('price', 12, 2);
            // Início e fim da vigência preservam todas as alterações de tarifa.
            $table->dateTime('effective_from');
            $table->dateTime('effective_to')->nullable();
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
            // Permite exclusão lógica.
// Cria o campo deleted_at para exclusão lógica.
            $table->softDeletes();
            $table->index(
                ['crop_id', 'block', 'route', 'effective_from'],
                'matrix_freight_effective_search'
            );
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
        Schema::dropIfExists('matrix_freights');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
