<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration dos produtos da OS.
return new class extends Migration
{
    // Cria a tabela de produtos planejados e realizados.
    public function up(): void
    {
        // Cria a tabela intermediária entre OS e produtos.
        Schema::create('agricultural_defensive_order_products', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona o item com sua OS.
            $table->foreignId('agricultural_defensive_order_id')->constrained('agricultural_defensive_orders', 'id', 'ado_prod_order_fk')->cascadeOnDelete();
            // Relaciona o item ao produto cadastrado.
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->unsignedInteger('sequence')->default(0);
            // Guarda a dose recomendada/histórica por bomba.
            $table->decimal('dose', 12, 3);
            // Guarda a quantidade recomendada do produto por bomba.
            $table->decimal('pump', 12, 3);
            // Guarda o total real de bombas utilizado para este produto/OS.
            $table->decimal('used_bomb', 12, 3)->default(0);
            // Guarda a quantidade recomendada calculada para a OS.
            $table->decimal('recommended_quantity', 14, 3)->default(0);
            // Guarda a quantidade realmente utilizada.
            $table->decimal('actual_quantity', 14, 3)->default(0);
            // Guarda a dose real registrada para histórico.
            $table->decimal('actual_dose', 12, 3)->nullable();
            // Registra criação e atualização.
            $table->timestamps();
            // Impede o mesmo produto de aparecer duas vezes na mesma OS.
            $table->unique(['agricultural_defensive_order_id', 'product_id'], 'ado_product_unique');
            // Cria índice para consultas por produto.
            $table->index('product_id');
            $table->index(['agricultural_defensive_order_id', 'sequence'], 'ado_product_sequence_idx');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('agricultural_defensive_order_products');
    }
};
