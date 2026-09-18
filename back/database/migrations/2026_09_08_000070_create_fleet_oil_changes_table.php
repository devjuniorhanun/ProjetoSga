<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fleet_oil_changes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->date('change_date')->nullable();
            $table->char('marking_type', 1);
            $table->decimal('meter_value', 14, 2);
            $table->decimal('quantity', 14, 3)->nullable();
            $table->decimal('next_meter_value', 14, 2)->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['fleet_id','change_date'], 'foc_fleet_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fleet_oil_changes'); }
};
