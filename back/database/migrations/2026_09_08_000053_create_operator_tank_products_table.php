<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration dos produtos existentes em cada tanque.
return new class extends Migration
{
    // Cria os saldos de produtos dos tanques.
    public function up(): void
    {
        // Cria a tabela de saldo por produto e tanque.
        Schema::create('operator_tank_products', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona o item ao tanque diário.
            $table->foreignId('operator_tank_id')->constrained('operator_tanks')->cascadeOnDelete();
            // Relaciona o item ao produto.
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            // Guarda o saldo que veio do dia anterior.
            $table->decimal('opening_quantity', 14, 3)->default(0);
            // Guarda o total retirado do estoque no dia.
            $table->decimal('withdrawn_quantity', 14, 3)->default(0);
            // Guarda o total utilizado em fechamentos no dia.
            $table->decimal('used_quantity', 14, 3)->default(0);
            // Guarda o total devolvido ao estoque no dia.
            $table->decimal('returned_quantity', 14, 3)->default(0);
            // Guarda o saldo atual materializado para consulta rápida.
            $table->decimal('current_quantity', 14, 3)->default(0);
            // Registra criação e atualização.
            $table->timestamps();
            // Impede o mesmo produto de ter duas linhas no mesmo tanque.
            $table->unique(['operator_tank_id', 'product_id'], 'operator_tank_product_unique');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('operator_tank_products');
    }
};
