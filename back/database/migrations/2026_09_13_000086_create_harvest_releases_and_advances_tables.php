<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('harvest_releases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('driver_id')->constrained()->restrictOnDelete();
            $table->foreignId('owner_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_state_registration_id')->constrained('farm_state_registrations')->restrictOnDelete();
            $table->foreignId('plot_field_id')->constrained()->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $table->foreignId('lanyard_id')->constrained()->restrictOnDelete();
            $table->foreignId('matrix_freight_id')->constrained('matrix_freights')->restrictOnDelete();
            $table->date('release_date');
            $table->string('shipping_number', 100);
            $table->string('control_number', 100);
            $table->decimal('gross_weight', 16, 3);
            $table->decimal('discount_weight', 16, 3);
            $table->decimal('discount', 8, 4);
            $table->decimal('net_weight', 16, 3);
            $table->decimal('liquid_bags', 10, 3);
            $table->decimal('gross_bags', 10, 2);
            $table->decimal('shipping_value', 12, 2);
            $table->char('status', 1)->default('A');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['crop_id', 'shipping_number'], 'harvest_release_crop_shipping_unique');
            $table->unique(['crop_id', 'control_number'], 'harvest_release_crop_control_unique');
            $table->index(['crop_id', 'driver_id', 'status'], 'harvest_release_driver_search');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('harvest_releases');
    }
};
