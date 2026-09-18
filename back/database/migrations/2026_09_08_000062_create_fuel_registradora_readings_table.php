<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_registradora_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_registradora_id')->constrained('fuel_registradoras')->restrictOnDelete();
            $table->date('reading_date')->nullable();
            $table->decimal('start_reading', 14, 3);
            $table->decimal('end_reading', 14, 3);
            $table->decimal('quantity', 14, 3);
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->unique(['fuel_registradora_id','reading_date'], 'frr_reg_date_uq');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_registradora_readings'); }
};
