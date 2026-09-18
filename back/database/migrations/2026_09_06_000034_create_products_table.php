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
        Schema::create('products', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            // Cria a chave estrangeira product_group_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('product_group_id')->constrained()->restrictOnDelete();
            // Cria a chave estrangeira sub_group_product_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('sub_group_product_id')->constrained()->restrictOnDelete();
            // Armazena o campo name como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('name', 255);
            // Armazena stock com precisão de três casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('stock', 12, 3)->nullable();
            $table->decimal('reserved_stock', 16, 3)->default(0);
            $table->decimal('average_cost', 16, 6)->default(0);
            $table->decimal('stock_total_value', 18, 2)->default(0);
            // Armazena o campo stock_location como texto.
// Cria um campo de texto na estrutura da tabela.
            $table->string('stock_location', 255)->nullable();
            // Armazena minimum_quantity com precisão de três casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('minimum_quantity', 12, 3)->nullable();
            // Armazena drum_box com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('drum_box', 12, 2);
            // Armazena gallon_package com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('gallon_package', 12, 2);
            // Armazena o campo unit como código de um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('unit', 1)->default('K');
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
        Schema::dropIfExists('products');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
