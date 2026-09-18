<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fleet_maintenance_plans', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->string('name', 150);
            $table->char('marking_type', 1);
            $table->decimal('interval_value', 14, 2);
            $table->decimal('base_meter_value', 14, 2)->nullable();
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->index(['fleet_id','marking_type','status'], 'fmp_fleet_type_status_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fleet_maintenance_plans'); }
};
