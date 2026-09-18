<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration da relação entre OS, operadores e frota.
return new class extends Migration
{
    // Cria a tabela de operadores vinculados às OS.
    public function up(): void
    {
        // Cria a tabela intermediária.
        Schema::create('agricultural_defensive_order_operators', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona com a OS.
            $table->foreignId('agricultural_defensive_order_id')->constrained('agricultural_defensive_orders', 'id', 'ado_ops_order_fk')->cascadeOnDelete();
            // Relaciona com o operador agrícola.
            $table->foreignId('operator_id')->constrained('agricultural_operators')->restrictOnDelete();
            // Relaciona opcionalmente com a frota usada na OS.
            $table->foreignId('fleet_id')->nullable()->constrained('fleets')->restrictOnDelete();
            // Guarda a função operacional do participante.
            $table->string('function', 1);
            // Registra criação e atualização.
            $table->timestamps();
            // Evita duplicar o mesmo operador/frota/função dentro da mesma OS.
            $table->unique(['agricultural_defensive_order_id', 'operator_id', 'fleet_id', 'function'], 'ado_operator_unique');
            // Cria índice para consultas por operador.
            $table->index('operator_id');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('agricultural_defensive_order_operators');
    }
};
