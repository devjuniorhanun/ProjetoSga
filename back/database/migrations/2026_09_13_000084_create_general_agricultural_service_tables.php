<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agricultural_service_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 60)->unique();
            $table->string('service_category', 40);
            $table->boolean('requires_input')->default(false);
            $table->boolean('allows_fixed_rate')->default(false);
            $table->boolean('allows_variable_rate')->default(false);
            $table->boolean('requires_fleet')->default(true);
            $table->boolean('requires_implement')->default(true);
            $table->char('status', 1)->default('A');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('general_agricultural_services', function (Blueprint $table): void {
            $table->id();
            $table->string('service_number', 40)->unique();
            $table->string('service_category', 40);
            $table->foreignId('agricultural_service_type_id')->constrained('agricultural_service_types', 'id', 'gas_type_fk')->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('farm_id')->constrained()->restrictOnDelete();
            $table->date('service_date');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->decimal('total_area', 14, 3)->default(0);
            $table->string('status', 30)->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('canceled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['service_category', 'status', 'service_date'], 'general_ag_service_search');
        });

        Schema::create('agricultural_service_plots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('general_agricultural_service_id')->constrained('general_agricultural_services', 'id', 'gas_plot_service_fk')->cascadeOnDelete();
            $table->foreignId('plot_field_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('pass_number')->default(1);
            $table->decimal('registered_area', 14, 3);
            $table->decimal('worked_area', 14, 3);
            $table->string('area_source', 20)->default('REGISTRATION');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('agricultural_service_operators', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('general_agricultural_service_id')->constrained('general_agricultural_services', 'id', 'gas_operator_service_fk')->cascadeOnDelete();
            $table->foreignId('agricultural_service_type_id')->constrained('agricultural_service_types', 'id', 'gas_operator_type_fk')->restrictOnDelete();
            $table->foreignId('agricultural_operator_id')->constrained()->restrictOnDelete();
            $table->foreignId('traction_fleet_id')->constrained('fleets')->restrictOnDelete();
            $table->foreignId('implement_fleet_id')->nullable()->constrained('fleets')->restrictOnDelete();
            $table->string('function', 30)->default('OPERATOR');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('agricultural_input_applications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('general_agricultural_service_id')->unique('ag_input_service_uq')->constrained('general_agricultural_services', 'id', 'gas_input_service_fk')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('rate_type', 20);
            $table->decimal('fixed_rate', 16, 6)->nullable();
            $table->string('rate_unit', 20);
            $table->decimal('recommended_quantity', 16, 3)->default(0);
            $table->decimal('real_quantity', 16, 3)->nullable();
            $table->decimal('difference_quantity', 16, 3)->nullable();
            $table->decimal('difference_percentage', 10, 4)->nullable();
            $table->timestamps();
        });

        Schema::create('agricultural_service_plot_rates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('agricultural_service_plot_id')->unique('ag_plot_rate_plot_uq')->constrained('agricultural_service_plots', 'id', 'gas_plot_rate_plot_fk')->cascadeOnDelete();
            $table->decimal('rate', 16, 6);
            $table->string('rate_unit', 20);
            $table->decimal('recommended_quantity', 16, 3);
            $table->decimal('real_quantity', 16, 3)->nullable();
            $table->json('calculation_snapshot')->nullable();
            $table->timestamps();
        });

        Schema::create('agricultural_service_stock_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('general_agricultural_service_id')->constrained('general_agricultural_services', 'id', 'gas_stock_service_fk')->cascadeOnDelete();
            $table->foreignId('agricultural_service_plot_id')->nullable()->constrained('agricultural_service_plots', 'id', 'gas_stock_plot_fk')->nullOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_stock_id')->constrained()->restrictOnDelete();
            $table->decimal('recommended_quantity', 16, 3)->default(0);
            $table->decimal('real_quantity', 16, 3);
            $table->foreignId('stock_movement_id')->nullable()->constrained('product_stock_movements')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('seed_treatments', function (Blueprint $table): void {
            $table->id();
            $table->string('treatment_number', 40)->unique();
            $table->date('service_date');
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->unsignedInteger('number_of_treatment_batches');
            $table->decimal('total_seed_quantity', 16, 3)->default(0);
            $table->string('status', 30)->default('DRAFT');
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('seed_treatment_seeds', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('seed_treatment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->foreignId('variety_culture_id')->constrained('variety_cultures')->restrictOnDelete();
            $table->foreignId('product_stock_id')->constrained()->restrictOnDelete();
            $table->string('lot_number', 100);
            $table->decimal('available_quantity_snapshot', 16, 3);
            $table->decimal('treated_quantity', 16, 3);
            $table->string('unit', 20);
            $table->unsignedInteger('treatment_batch_quantity')->default(1);
            $table->string('treatment_batch_number', 100)->nullable();
            $table->timestamps();
            $table->unique(['seed_treatment_id', 'product_stock_id'], 'seed_treatment_stock_unique');
        });

        Schema::create('seed_treatment_products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('seed_treatment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_stock_id')->constrained()->restrictOnDelete();
            $table->decimal('dose_per_batch', 16, 6)->nullable();
            $table->decimal('recommended_quantity', 16, 3)->default(0);
            $table->decimal('real_quantity', 16, 3);
            $table->string('unit', 20);
            $table->foreignId('stock_movement_id')->nullable()->constrained('product_stock_movements')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('firebreak_maintenances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('general_agricultural_service_id')->unique('firebreak_service_uq')->constrained('general_agricultural_services', 'id', 'firebreak_service_fk')->cascadeOnDelete();
            $table->decimal('length_meters', 16, 3)->default(0);
            $table->decimal('width_meters', 16, 3)->default(0);
            $table->decimal('calculated_area', 14, 3)->default(0);
            $table->decimal('actual_area', 14, 3)->nullable();
            $table->timestamps();
        });

        Schema::create('firebreak_maintenance_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('firebreak_maintenance_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plot_field_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedInteger('sequence');
            $table->string('description')->nullable();
            $table->decimal('length_meters', 16, 3);
            $table->decimal('width_meters', 16, 3);
            $table->decimal('calculated_area', 14, 3);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['firebreak_maintenance_locations','firebreak_maintenances','seed_treatment_products','seed_treatment_seeds','seed_treatments','agricultural_service_stock_allocations','agricultural_service_plot_rates','agricultural_input_applications','agricultural_service_operators','agricultural_service_plots','general_agricultural_services','agricultural_service_types'] as $table) Schema::dropIfExists($table);
    }
};
