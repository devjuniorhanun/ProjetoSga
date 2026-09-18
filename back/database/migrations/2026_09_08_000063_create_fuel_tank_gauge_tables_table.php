<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_tank_gauge_tables', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_tank_id')->constrained('fuel_tanks')->restrictOnDelete();
            $table->decimal('centimeters', 10, 2);
            $table->decimal('liters', 14, 3);
            $table->timestamps();
            $table->unique(['fuel_tank_id','centimeters'], 'fgt_tank_cm_uq');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_tank_gauge_tables'); }
};
