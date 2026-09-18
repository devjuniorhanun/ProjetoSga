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
        Schema::create('configs', function (Blueprint $table): void {
// Cria a chave primária inteira com incremento automático.
            $table->id();
// Cria um campo de texto na estrutura da tabela.
            $table->string('producer_name', 150);
// Cria um campo de texto na estrutura da tabela.
            $table->string('property_name', 150);
// Cria um campo de texto na estrutura da tabela.
            $table->string('producer_color', 20);
// Cria um campo de texto na estrutura da tabela.
            $table->string('property_color', 20);
            $table->string('logo_path')->nullable();
// Define o valor padrão utilizado quando o campo não for informado.
            $table->char('status', 1)->default('A');
// Cria os campos created_at e updated_at.
            $table->timestamps();
// Cria o campo deleted_at para exclusão lógica.
            $table->softDeletes();
// Cria uma restrição para impedir valores duplicados.
            $table->unique(['producer_name', 'property_name']);
// Executa a instrução correspondente à regra ou operação atual.
            $table->index('status');
// Executa a instrução correspondente à regra ou operação atual.
        });
// Fecha o bloco de código atual.
    }
// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('configs'); }
// Fecha a definição atual.
};
