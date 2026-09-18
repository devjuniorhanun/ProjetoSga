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
        Schema::create('fleets', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira fleet_group_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('fleet_group_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira fleet_brand_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('fleet_brand_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira fleet_model_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('fleet_model_id')->constrained()->restrictOnDelete();
            // Armazena o campo name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('name', 255);
            // Armazena o campo code como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('code', 255);
            // Armazena o campo plate como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('plate', 255);
            // Armazena o campo fleet_type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('fleet_type', 1)->default('P');
            // Armazena o campo year como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('year', 255);
            // Armazena o campo chassi como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('chassi', 255);
            // Armazena a data acquisition_date.
// Cria um campo para armazenar uma data.
            $table->date('acquisition_date')->nullable();
            // Armazena acquisition_value com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('acquisition_value', 12, 2);
            // Armazena o campo fuel_type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('fuel_type', 1)->default('A');
            // Armazena o campo marking_type como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('marking_type', 1)->default('H');
            // Armazena starting_meter com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('starting_meter', 12, 2);
            // Armazena end_gauge com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('end_gauge', 12, 2);
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
        Schema::dropIfExists('fleets');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
