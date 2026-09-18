<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_tank_gauge_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_tank_id')->constrained('fuel_tanks')->restrictOnDelete();
            $table->dateTime('reading_at')->nullable();
            $table->decimal('centimeters', 10, 2);
            $table->decimal('liters', 14, 3)->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['fuel_tank_id','reading_at'], 'fgread_tank_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_tank_gauge_readings'); }
};
