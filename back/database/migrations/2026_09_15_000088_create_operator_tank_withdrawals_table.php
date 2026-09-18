<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operator_tank_withdrawals', function (Blueprint $table): void {
            $table->id();
            $table->string('withdrawal_number', 40)->nullable()->unique();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('operator_tank_id')->constrained('operator_tanks')->restrictOnDelete();
            $table->date('cutoff_date');
            $table->timestamp('occurred_at');
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->char('status', 1)->default('A');
            $table->timestamps();
            $table->index(['crop_id', 'cutoff_date'], 'otw_crop_cutoff_idx');
            $table->index(['operator_tank_id', 'occurred_at'], 'otw_tank_occurred_idx');
        });

        Schema::create('operator_tank_withdrawal_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('operator_tank_withdrawal_id')
                ->constrained('operator_tank_withdrawals', 'id', 'otwi_withdrawal_fk')
                ->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->decimal('stock_before', 16, 3);
            $table->decimal('stock_after', 16, 3);
            $table->decimal('tank_balance_before', 16, 3);
            $table->decimal('tank_balance_after', 16, 3);
            $table->foreignId('product_stock_movement_id')->nullable()->constrained('product_stock_movements', 'id', 'otwi_stock_movement_fk')->nullOnDelete();
            $table->foreignId('operator_tank_movement_id')->nullable()->constrained('operator_tank_movements', 'id', 'otwi_tank_movement_fk')->nullOnDelete();
            $table->timestamps();
            $table->unique(['operator_tank_withdrawal_id', 'product_id'], 'otwi_withdrawal_product_uq');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operator_tank_withdrawal_items');
        Schema::dropIfExists('operator_tank_withdrawals');
    }
};
