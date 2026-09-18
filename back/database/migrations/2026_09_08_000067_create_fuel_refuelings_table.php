<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_refuelings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->foreignId('operator_id')->nullable()->constrained('agricultural_operators')->nullOnDelete();
            $table->foreignId('fuel_registradora_id')->nullable()->constrained('fuel_registradoras')->nullOnDelete();
            $table->dateTime('refueled_at')->nullable();
            $table->decimal('quantity', 14, 3);
            $table->decimal('unit_price', 14, 4)->nullable();
            $table->decimal('total_value', 16, 2)->nullable();
            $table->char('marking_type', 1); // H = Horímetro; K = Quilômetro. Deve coincidir com fleets.marking_type.
            $table->decimal('meter_value', 14, 2)->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['fleet_id','refueled_at'], 'fr_fleet_date_idx');
            $table->index(['fuel_station_id','product_id','refueled_at'], 'fr_station_product_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_refuelings'); }
};
