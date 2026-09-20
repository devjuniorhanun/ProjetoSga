<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table): void {
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->primary(['permission_id', 'role_id']);
        });

        Schema::create('farm_state_registrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_id')->constrained()->restrictOnDelete();
            $table->string('state_registration', 50)->unique();
            $table->string('description')->nullable();
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['producer_id', 'farm_id', 'status'], 'farm_state_reg_search');
        });

        Schema::create('grain_scales', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->string('manufacturer')->nullable();
            $table->string('model')->nullable();
            $table->string('serial_number')->nullable();
            $table->string('location')->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('grain_scale_channels', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_scale_id')->constrained('grain_scales')->restrictOnDelete();
            $table->string('code', 30);
            $table->string('description')->nullable();
            $table->decimal('maximum_weight', 14, 3);
            $table->decimal('minimum_weight', 14, 3)->default(0);
            $table->decimal('division_weight', 10, 3);
            $table->string('unit', 10)->default('kg');
            $table->json('serial_configuration')->nullable();
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['grain_scale_id', 'code'], 'grain_scale_channel_unique');
        });

        Schema::create('grain_warehouses', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->foreignId('producer_id')->nullable()->constrained()->nullOnDelete();
            $table->string('address')->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('grain_storage_locations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_warehouse_id')->constrained('grain_warehouses')->restrictOnDelete();
            $table->string('name');
            $table->string('code', 50);
            $table->string('storage_type', 30)->default('CONVENTIONAL_SILO');
            $table->decimal('capacity', 14, 3)->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['grain_warehouse_id', 'code'], 'grain_storage_location_unique');
        });

        Schema::create('grain_transport_drivers', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('cpf', 14)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('grain_transport_trucks', function (Blueprint $table): void {
            $table->id();
            $table->string('license_plate', 10)->unique();
            $table->string('description')->nullable();
            $table->string('brand')->nullable();
            $table->string('model')->nullable();
            $table->string('color', 50)->nullable();
            $table->decimal('maximum_gross_weight', 14, 3);
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('grain_impurity_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 50)->unique();
            $table->string('measurement_unit', 20)->default('KG');
            $table->boolean('requires_destination')->default(false);
            $table->char('status', 1)->default('A');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('grain_discount_types', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('code', 50);
            $table->string('measurement_type', 20)->default('PERCENTAGE');
            $table->string('measurement_unit', 20)->default('PERCENT');
            $table->string('calculation_method', 20)->default('MANUAL');
            $table->boolean('affects_commercial_weight')->default(true);
            $table->boolean('generates_impurity')->default(false);
            $table->foreignId('grain_impurity_type_id')->nullable()->constrained('grain_impurity_types')->nullOnDelete();
            $table->unsignedInteger('display_order')->default(0);
            $table->char('status', 1)->default('A');
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['culture_id', 'code'], 'grain_discount_type_unique');
        });

        Schema::create('grain_technical_loss_configs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->decimal('monthly_percentage', 8, 5);
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->char('status', 1)->default('A');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['producer_id', 'culture_id', 'status'], 'grain_loss_config_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grain_technical_loss_configs');
        Schema::dropIfExists('grain_discount_types');
        Schema::dropIfExists('grain_impurity_types');
        Schema::dropIfExists('grain_transport_trucks');
        Schema::dropIfExists('grain_transport_drivers');
        Schema::dropIfExists('grain_storage_locations');
        Schema::dropIfExists('grain_warehouses');
        Schema::dropIfExists('grain_scale_channels');
        Schema::dropIfExists('grain_scales');
        Schema::dropIfExists('farm_state_registrations');
        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
    }
};
