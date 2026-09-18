<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('fuel_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->char('movement_type', 1); // E entrada; S saída; T transferência; D devolução; A ajuste.
            $table->char('direction', 1); // I entrada no estoque; O saída do estoque.
            $table->decimal('quantity', 14, 3);
            $table->decimal('stock_before', 14, 3);
            $table->decimal('stock_after', 14, 3);
            $table->decimal('unit_cost', 14, 4)->nullable();
            $table->decimal('total_cost', 16, 2)->nullable();
            $table->string('reference_type', 80)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['fuel_station_id','product_id','created_at'], 'fsm_station_product_date_idx');
            $table->index(['reference_type','reference_id'], 'fsm_reference_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_stock_movements'); }
};
