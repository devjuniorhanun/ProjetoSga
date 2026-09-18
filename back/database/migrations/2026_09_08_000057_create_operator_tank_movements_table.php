<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration do histórico físico de movimentações dos tanques.
return new class extends Migration
{
    // Cria o histórico de entradas, consumos, devoluções e ajustes do tanque.
    public function up(): void
    {
        // Cria a tabela de movimentos.
        Schema::create('operator_tank_movements', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona o movimento ao tanque.
            $table->foreignId('operator_tank_id')->constrained('operator_tanks')->restrictOnDelete();
            // Relaciona opcionalmente ao produto.
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            // Relaciona opcionalmente ao fechamento da OS.
            $table->foreignId('closing_id')->nullable()->constrained('agricultural_defensive_order_closings')->nullOnDelete();
            // Relaciona opcionalmente à OS diretamente.
            $table->foreignId('order_id')->nullable()->constrained('agricultural_defensive_orders')->nullOnDelete();
            // Define o tipo do movimento.
            $table->string('movement_type', 20);
            // Guarda a quantidade movimentada.
            $table->decimal('quantity', 14, 3);
            // Guarda observação operacional.
            $table->string('observation', 500)->nullable();
            // Registra criação e atualização.
            $table->timestamps();
            // Cria índice para auditoria por tanque.
            $table->index(['operator_tank_id', 'movement_type']);
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('operator_tank_movements');
    }
};
