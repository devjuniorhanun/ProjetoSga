<?php

// Importa a classe base das migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Cria a tabela de safras agrícolas.
return new class extends Migration
{
    // Cria a estrutura da tabela.
    public function up(): void
    {
        Schema::create('crops', function (Blueprint $table): void {
            // Chave primária auto incrementável.
            $table->id();

            // Relaciona a safra ao ano agrícola.
            $table->foreignId('agricultural_year_id')
                ->constrained('agricultural_years')
                ->restrictOnDelete();

            // Nome da safra.
            $table->string('name', 100);

            // Data inicial.
            $table->date('opening_date')->nullable();

            // Data final.
            $table->date('closing_date')->nullable();

            // Status A/I.
            $table->char('status', 1)->default('A');

            // Timestamps padrão do Laravel.
            $table->timestamps();

            // Exclusão lógica.
            $table->softDeletes();

            // O nome pode se repetir em anos agrícolas diferentes.
            $table->unique([
                'agricultural_year_id',
                'name',
            ]);

            // Índice para consultas por status.
            $table->index('status');
        });
    }

    // Remove a tabela durante rollback.
    public function down(): void
    {
        Schema::dropIfExists('crops');
    }
};
