<?php

// Importa a classe base para criar uma migration do Laravel.
use Illuminate\Database\Migrations\Migration;
// Importa o objeto usado para definir a estrutura das colunas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada responsável pelas operações de schema.
use Illuminate\Support\Facades\Schema;

// Retorna uma migration anônima para criar e remover a tabela de OS.
return new class extends Migration
{
    // Executa a criação da tabela principal das ordens de serviço.
    public function up(): void
    {
        // Cria a tabela que representa uma OS individual por talhão.
        Schema::create('agricultural_defensive_orders', function (Blueprint $table): void {
            // Cria a chave primária inteira e auto incrementável.
            $table->id();
            // Guarda o número público da OS e permite que ele seja usado em buscas.
            $table->unsignedBigInteger('os_number')->nullable()->unique();
            // Permite relacionar uma OS filha à OS pai geradora.
            $table->foreignId('parent_order_id')->nullable()->constrained('agricultural_defensive_orders')->nullOnDelete();
            // Relaciona a OS a exatamente um talhão.
            $table->foreignId('field_id')->constrained('fields')->restrictOnDelete();
            // Guarda a área do talhão destinada à OS.
            $table->decimal('area', 12, 3);
            // Relaciona a OS à safra.
            $table->foreignId('crop_id')->constrained('crops')->restrictOnDelete();
            // Relaciona a OS à cultura.
            $table->foreignId('culture_id')->constrained('cultures')->restrictOnDelete();
            // Relaciona a OS ao tipo de operação agrícola.
            $table->foreignId('type_operation_id')->constrained('type_operations')->restrictOnDelete();
            // Guarda a data planejada da aplicação.
            $table->date('application_date')->nullable();
            // Guarda o volume do tanque/pulverizador.
            $table->decimal('pump_volume', 12, 3);
            // Guarda a quantidade recomendada de bombas para a OS.
            $table->decimal('recommended_pump', 12, 3);
            // Guarda a vazão informada para a operação.
            $table->decimal('flow', 12, 3);
            // Guarda a capacidade da bomba/tanque informada para a operação.
            $table->decimal('pump_capacity', 12, 3);
            // Guarda o total real acumulado de bombas utilizadas.
            $table->decimal('used_bomb', 12, 3)->default(0);
            // Guarda o status operacional da OS.
            $table->string('status', 1)->default('A');
            // Registra criação e atualização.
            $table->timestamps();
            // Cria índice para consultas por talhão.
            $table->index('field_id');
            // Cria índice para consultas por data de aplicação.
            $table->index('application_date');
            // Cria índice para consultas por OS pai.
            $table->index('parent_order_id');
        });
    }

    // Remove a tabela durante o rollback.
    public function down(): void
    {
        // Remove a tabela somente se ela existir.
        Schema::dropIfExists('agricultural_defensive_orders');
    }
};
