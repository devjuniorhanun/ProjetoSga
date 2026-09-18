<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration dos fechamentos parciais e finais das OS.
return new class extends Migration
{
    // Cria o histórico de cada fechamento.
    public function up(): void
    {
        // Cria a tabela de fechamentos.
        Schema::create('agricultural_defensive_order_closings', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona o fechamento à OS.
            $table->foreignId('agricultural_defensive_order_id')->constrained('agricultural_defensive_orders', 'id', 'ado_close_order_fk')->restrictOnDelete();
            // Relaciona o fechamento ao tanque que realizou o consumo.
            $table->foreignId('operator_tank_id')->constrained('operator_tanks')->restrictOnDelete();
            // Guarda a quantidade de bombas utilizadas neste evento.
            $table->decimal('closing_bomb', 12, 3);
            // Define se o evento foi parcial ou final.
            $table->string('closing_type', 10);
            // Guarda a data/hora efetiva do fechamento.
            $table->timestamp('closed_at');
            // Guarda o usuário responsável pelo lançamento.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            // Registra criação e atualização.
            $table->timestamps();
            // Cria índice para o histórico da OS.
            $table->index(['agricultural_defensive_order_id', 'closed_at'], 'ado_close_date_idx');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('agricultural_defensive_order_closings');
    }
};
