<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_transfers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('source_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('source_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->foreignId('destination_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('destination_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->dateTime('transfer_date')->nullable();
            $table->decimal('quantity', 14, 3);
            $table->char('status', 1)->default('D'); // D = rascunho; C = confirmado; X = cancelado.
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('document_number', 100)->nullable();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['source_station_id','destination_station_id','transfer_date'], 'ftr_route_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_transfers'); }
};
