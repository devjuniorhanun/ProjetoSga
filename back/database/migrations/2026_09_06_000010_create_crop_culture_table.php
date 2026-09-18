<?php

// Importa a classe base das migrations.
use Illuminate\Database\Migrations\Migration;
// Importa o construtor de tabelas.
use Illuminate\Database\Schema\Blueprint;
// Importa a fachada de schema.
use Illuminate\Support\Facades\Schema;

// Cria a tabela intermediária entre safras e culturas.
return new class extends Migration
{
    // Cria a estrutura da tabela pivô.
    public function up(): void
    {
        Schema::create('crop_culture', function (Blueprint $table): void {
            // Chave primária técnica da tabela pivô.
            $table->id();

            // Relaciona a cultura com uma safra.
            $table->foreignId('crop_id')
                ->constrained('crops')
                ->cascadeOnDelete();

            // Relaciona a safra com uma cultura.
            $table->foreignId('culture_id')
                ->constrained('cultures')
                ->cascadeOnDelete();

            // Evita repetir a mesma cultura dentro da mesma safra.
            $table->unique([
                'crop_id',
                'culture_id',
            ]);

            // Registra criação e atualização.
            $table->timestamps();
        });
    }

    // Remove a tabela pivô durante rollback.
    public function down(): void
    {
        Schema::dropIfExists('crop_culture');
    }
};
