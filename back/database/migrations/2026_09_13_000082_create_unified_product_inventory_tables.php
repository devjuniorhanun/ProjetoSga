<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_sequences', function (Blueprint $table): void {
            $table->id();
            $table->string('document_type', 40);
            $table->unsignedSmallInteger('year');
            $table->unsignedBigInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique(['document_type', 'year'], 'document_sequence_unique');
        });

        Schema::create('stock_locations', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 60)->unique();
            $table->string('location_type', 30);
            $table->foreignId('producer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('administrative_center_id')->nullable()->constrained('administrative_centers')->nullOnDelete();
            $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('plot_field_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_station_id')->nullable()->constrained('fuel_stations')->nullOnDelete();
            $table->decimal('maximum_capacity', 16, 3)->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['location_type', 'status'], 'stock_location_type_status');
        });

        Schema::create('product_stock_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('invoice_entry_type', 30);
            $table->string('default_destination_type', 30);
            $table->boolean('controls_stock')->default(true);
            $table->boolean('allows_freight')->default(false);
            $table->boolean('requires_batch')->default(false);
            $table->boolean('requires_expiration_date')->default(false);
            $table->char('status', 1)->default('A');
            $table->timestamps();
        });

        Schema::create('seed_product_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->foreignId('variety_culture_id')->constrained('variety_cultures')->restrictOnDelete();
            $table->string('seed_category', 50)->nullable();
            $table->string('seed_class', 50)->nullable();
            $table->string('default_unit', 20);
            $table->char('status', 1)->default('A');
            $table->timestamps();
        });

        Schema::create('product_stocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('stock_location_id')->constrained()->restrictOnDelete();
            $table->string('batch', 100)->default('');
            $table->date('expiration_date')->nullable();
            $table->string('treatment_status', 20)->default('NOT_APPLICABLE');
            $table->decimal('quantity', 16, 3)->default(0);
            $table->decimal('reserved_quantity', 16, 3)->default(0);
            $table->decimal('average_cost', 16, 6)->default(0);
            $table->decimal('total_value', 18, 2)->default(0);
            $table->timestamps();
            $table->unique(['product_id', 'stock_location_id', 'batch', 'treatment_status'], 'product_stock_position_unique');
            $table->index(['product_id', 'quantity'], 'product_stock_available_search');
        });

        Schema::create('product_stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->string('movement_number', 40)->nullable()->unique();
            $table->foreignId('product_stock_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('stock_location_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('agricultural_defensive_orders')->nullOnDelete();
            $table->foreignId('operator_tank_id')->nullable()->constrained('operator_tanks')->nullOnDelete();
            $table->string('movement_type', 50);
            $table->decimal('quantity', 16, 3);
            $table->decimal('unit_value', 16, 6)->default(0);
            $table->decimal('total_value', 18, 2)->default(0);
            $table->decimal('partial_balance_before', 16, 3)->nullable();
            $table->decimal('partial_balance_after', 16, 3)->nullable();
            $table->decimal('general_balance_before', 16, 3)->nullable();
            $table->decimal('general_balance_after', 16, 3)->nullable();
            $table->decimal('stock_before', 16, 3)->nullable();
            $table->decimal('stock_after', 16, 3)->nullable();
            $table->string('source_type', 120)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->text('reason')->nullable();
            $table->string('observation', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('occurred_at')->nullable();
            $table->timestamps();
            $table->index(['source_type', 'source_id'], 'product_stock_movement_source');
            $table->index(['product_id', 'occurred_at'], 'product_stock_movement_product');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('product_stock_movements');
        Schema::dropIfExists('product_stocks');
        Schema::dropIfExists('seed_product_profiles');
        Schema::dropIfExists('product_stock_profiles');
        Schema::dropIfExists('stock_locations');
        Schema::dropIfExists('document_sequences');
    }
};
