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
        Schema::create('drivers_contracts', function (Blueprint $table): void {
            // Cria o identificador inteiro auto incrementável.
// Cria a chave primária inteira com incremento automático.
            $table->id();
            $table->string('contract_number', 40)->nullable()->unique();
            $table->uuid('generation_batch')->nullable()->index();
            // Cria a chave estrangeira crop_id como inteiro sem sinal.
// Cria uma chave estrangeira inteira para relacionar esta tabela a outra.
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('producer_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('bank_supplier_id')->nullable()->constrained('bank_suppliers')->nullOnDelete();
            // Armazena a data opening_date.
// Cria um campo para armazenar uma data.
            $table->date('opening_date')->nullable();
            // Armazena a data closing_date.
// Cria um campo para armazenar uma data.
            $table->date('closing_date')->nullable();
            // Armazena shipping_cost com duas casas decimais.
// Cria um campo decimal para valores que exigem precisão.
            $table->decimal('shipping_cost', 12, 2);
            $table->string('calculation_basis', 30)->default('GROSS_BAGS');
            $table->decimal('bag_weight', 8, 3)->default(60);
            $table->text('service_hours')->nullable();
            $table->text('extra_service_description')->nullable();
            $table->text('observations')->nullable();
            $table->json('producer_snapshot')->nullable();
            $table->json('supplier_snapshot')->nullable();
            $table->json('participants_snapshot')->nullable();
            $table->json('bank_snapshot')->nullable();
            $table->json('contract_snapshot')->nullable();
            $table->string('pdf_path')->nullable();
            $table->string('pdf_hash', 64)->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            // Armazena o status com um caractere.
// Cria um campo de texto na estrutura da tabela.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
// Cria os campos created_at e updated_at.
            $table->timestamps();
            // Permite exclusão lógica.
// Cria o campo deleted_at para exclusão lógica.
            $table->softDeletes();
            $table->index(['crop_id', 'supplier_id', 'producer_id'], 'driver_contract_lookup');
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
        Schema::dropIfExists('drivers_contracts');
// Fecha o bloco de código atual.
    }
// Fecha a definição atual.
};
