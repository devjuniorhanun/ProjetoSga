<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_registradoras', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('name', 100);
            $table->decimal('initial_reading', 14, 3)->default(0);
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['fuel_station_id','product_id'], 'fr_station_product_uq');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_registradoras'); }
};
