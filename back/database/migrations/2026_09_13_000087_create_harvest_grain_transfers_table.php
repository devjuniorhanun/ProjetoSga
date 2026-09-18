<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('harvest_grain_transfers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('owner_id')->constrained()->restrictOnDelete();
            $table->foreignId('warehouse_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->date('transfer_date');
            $table->decimal('quantity_kg', 16, 3);
            $table->decimal('quantity_bags', 16, 3);
            $table->text('observation')->nullable();
            $table->char('status', 1)->default('A');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['crop_id', 'producer_id', 'warehouse_id', 'culture_id', 'status'], 'harvest_transfer_balance_search');
            $table->index(['owner_id', 'transfer_date'], 'harvest_transfer_owner_search');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('harvest_grain_transfers');
    }
};
