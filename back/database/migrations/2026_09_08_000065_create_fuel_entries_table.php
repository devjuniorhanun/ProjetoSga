<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->foreignId('fuel_tank_id')->nullable()->constrained('fuel_tanks')->nullOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->date('entry_date')->nullable();
            $table->decimal('quantity', 14, 3);
            $table->decimal('unit_price', 14, 4)->nullable();
            $table->decimal('total_value', 16, 2)->nullable();
            $table->string('invoice_number', 100)->nullable();
            $table->char('status', 1)->default('A');
            $table->foreignId('responsible_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('observation', 500)->nullable();
            $table->timestamps();
            $table->index(['fuel_station_id','product_id','entry_date'], 'fe_station_product_date_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_entries'); }
};
