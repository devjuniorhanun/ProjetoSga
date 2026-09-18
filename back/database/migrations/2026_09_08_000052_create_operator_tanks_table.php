<?php

// Importa a classe base de migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Define a migration dos tanques diários dos operadores.
return new class extends Migration
{
    // Cria um tanque operacional por operador e por dia.
    public function up(): void
    {
        // Cria a tabela principal do tanque diário.
        Schema::create('operator_tanks', function (Blueprint $table): void {
            // Cria a chave primária.
            $table->id();
            // Relaciona o tanque ao operador agrícola.
            $table->foreignId('operator_id')->constrained('agricultural_operators')->restrictOnDelete();
            // Define o dia operacional do tanque.
            $table->date('date')->nullable();
            // Guarda o status do tanque diário.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
            $table->timestamps();
            // Impede dois tanques para o mesmo operador no mesmo dia.
            $table->unique(['operator_id', 'date'], 'operator_tank_operator_date_unique');
        });
    }

    // Remove a tabela no rollback.
    public function down(): void
    {
        // Exclui a tabela caso exista.
        Schema::dropIfExists('operator_tanks');
    }
};
