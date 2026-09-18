<?php

// Importa a classe base das migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Cria a tabela de variedades de culturas.
return new class extends Migration
{
    // Cria a estrutura da tabela.
    public function up(): void
    {
        Schema::create('variety_cultures', function (Blueprint $table): void {
            // Chave primária auto incrementável.
            $table->id();

            // Relaciona a variedade à cultura.
            $table->foreignId('culture_id')
                ->constrained('cultures')
                ->restrictOnDelete();

            // Nome da variedade.
            $table->string('name', 100);

            // Tecnologia da variedade.
            $table->string('technology', 100);

            // Ciclo da variedade.
            $table->string('cycle', 100);

            // Quantidade de dias de florescimento.
            $table->unsignedInteger('flowering_days')->nullable();

            // Status A/I.
            $table->char('status', 1)->default('A');

            // Timestamps padrão.
            $table->timestamps();

            // Exclusão lógica.
            $table->softDeletes();

            // Permite nomes iguais em culturas diferentes.
            $table->unique([
                'culture_id',
                'name',
            ]);

            // Índice para consultas por status.
            $table->index('status');
        });
    }

    // Remove a tabela durante rollback.
    public function down(): void
    {
        Schema::dropIfExists('variety_cultures');
    }
};
