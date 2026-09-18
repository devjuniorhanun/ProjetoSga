<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fleet_maintenance_records', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->foreignId('maintenance_plan_id')->nullable()->constrained('fleet_maintenance_plans')->nullOnDelete();
            $table->date('maintenance_date')->nullable();
            $table->char('marking_type', 1);
            $table->decimal('meter_value', 14, 2);
            $table->decimal('next_meter_value', 14, 2)->nullable();
            $table->decimal('cost', 16, 2)->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('description', 500)->nullable();
            $table->timestamps();
            $table->index(['fleet_id','maintenance_date'], 'fmr_fleet_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fleet_maintenance_records'); }
};
