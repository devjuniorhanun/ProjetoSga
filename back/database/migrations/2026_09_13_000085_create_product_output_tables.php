<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_outputs', function (Blueprint $table): void {
            $table->id();
            $table->string('output_number', 40)->unique();
            $table->string('output_type', 30);
            $table->date('output_date');
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('administrative_center_id')->constrained('administrative_centers')->restrictOnDelete();
            $table->foreignId('cost_center_id')->constrained('cost_centers')->restrictOnDelete();
            $table->foreignId('recipient_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('recipient_name')->nullable();
            $table->date('expected_return_date')->nullable();
            $table->string('status', 30)->default('DRAFT');
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('product_output_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_output_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_stock_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->decimal('unit_value', 16, 6)->default(0);
            $table->decimal('total_value', 18, 2)->default(0);
            $table->decimal('returned_quantity', 16, 3)->default(0);
            $table->foreignId('stock_movement_id')->nullable()->constrained('product_stock_movements')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('product_output_returns', function (Blueprint $table): void {
            $table->id();
            $table->string('return_number', 40)->unique();
            $table->foreignId('product_output_id')->constrained()->restrictOnDelete();
            $table->date('return_date');
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('product_output_return_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_output_return_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_output_item_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->foreignId('stock_movement_id')->nullable()->constrained('product_stock_movements')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_output_return_items');
        Schema::dropIfExists('product_output_returns');
        Schema::dropIfExists('product_output_items');
        Schema::dropIfExists('product_outputs');
    }
};
