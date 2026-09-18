<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_station_products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('minimum_stock', 14, 3)->default(0);
            $table->decimal('maximum_stock', 14, 3)->nullable();
            $table->decimal('current_stock', 14, 3)->default(0);
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->unique(['fuel_station_id','product_id'], 'fsp_station_product_uq');
            $table->index(['fuel_station_id','status'], 'fsp_station_status_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_station_products'); }
};
