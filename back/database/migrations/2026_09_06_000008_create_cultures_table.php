<?php
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Migrations\Migration;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Database\Schema\Blueprint;
// Importa uma dependência utilizada neste arquivo.
use Illuminate\Support\Facades\Schema;
// Retorna o resultado da operação atual.
return new class extends Migration {
// Declara o método responsável por esta operação.
    public function up(): void { Schema::create('cultures', function (Blueprint $table): void {
// Cria a chave primária inteira com incremento automático.
        $table->id(); $table->string('name', 100)->unique(); $table->char('status',1)->default('A'); $table->timestamps(); $table->softDeletes(); $table->index('status');
// Executa a instrução correspondente à regra ou operação atual.
    }); }
// Declara o método responsável por esta operação.
    public function down(): void { Schema::dropIfExists('cultures'); }
// Fecha a definição atual.
};
