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
        Schema::create('plot_fields', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira field_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('field_id')->constrained()->restrictOnDelete();
            $table->string('name', 150);
            // Cria a chave estrangeira crop_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira culture_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira variety_culture_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('variety_culture_id')->constrained()->restrictOnDelete();
            // Armazena area com precisão de três casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('area', 12, 3)->nullable();
            // Armazena pms com precisão de três casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('pms', 12, 3)->nullable();
            // Armazena linear_seed com precisão de três casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('linear_seed', 12, 3)->nullable();
            // Armazena a data start_planting.
// Cria um campo para armazenar uma data.
            $table->date('start_planting')->nullable();
            // Armazena a data final_planting.
// Cria um campo para armazenar uma data.
            $table->date('final_planting')->nullable();
            // Armazena a data expected_date.
// Cria um campo para armazenar uma data.
            $table->date('expected_date')->nullable();
            // Armazena o conteúdo textual de observations.
// Cria um campo de texto longo na estrutura da tabela.
            $table->text('observations')->nullable();
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
            // Permite exclusão lógica.
// Cria o campo deleted_at para exclusão lógica.
            $table->softDeletes();
            $table->index(['crop_id', 'field_id', 'name'], 'plot_field_crop_field_name_search');
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
        Schema::dropIfExists('plot_fields');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
