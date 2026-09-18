<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration do histórico de OS anteriores usado na edição.
return new class extends Migration
{
    // Cria a relação entre a nova OS filha e a OS antiga.
    public function up(): void
    {
        // Cria a tabela de referência das OS anteriores.
        Schema::create('agricultural_defensive_order_previous_orders', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Guarda a nova OS que recebeu a referência.
            $table->foreignId('order_id')->constrained('agricultural_defensive_orders', 'id', 'ado_prev_new_order_fk')->cascadeOnDelete();
            // Guarda a OS antiga correspondente ao os_number informado.
            $table->foreignId('previous_order_id')->constrained('agricultural_defensive_orders', 'id', 'ado_prev_order_fk')->restrictOnDelete();
            // Guarda a quantidade de bombas utilizadas da OS antiga.
            $table->decimal('quantity_used', 12, 3);
            // Registra criação e atualização.
            $table->timestamps();
            // Permite a mesma OS antiga aparecer mais de uma vez, pois cada ocorrência pode ter quantidade diferente.
            $table->index(['order_id', 'previous_order_id'], 'ado_prev_order_idx');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('agricultural_defensive_order_previous_orders');
    }
};
