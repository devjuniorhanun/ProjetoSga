<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fleet_meter_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->date('reading_date')->nullable();
            $table->char('marking_type', 1); // H ou K.
            $table->decimal('initial_value', 14, 2)->nullable();
            $table->decimal('final_value', 14, 2);
            $table->decimal('worked_value', 14, 2)->default(0);
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->unique(['fleet_id','reading_date'], 'fmr_fleet_date_uq');
        });
    }
    public function down(): void { Schema::dropIfExists('fleet_meter_readings'); }
};
