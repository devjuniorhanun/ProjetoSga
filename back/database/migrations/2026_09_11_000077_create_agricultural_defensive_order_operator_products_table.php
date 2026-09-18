<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agricultural_defensive_order_operator_products', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('agricultural_defensive_order_id')
                ->constrained('agricultural_defensive_orders', 'id', 'ado_op_prod_order_fk')
                ->cascadeOnDelete();
            $table->foreignId('agricultural_defensive_order_operator_id')
                ->constrained('agricultural_defensive_order_operators', 'id', 'ado_op_prod_operator_fk')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('products', 'id', 'ado_op_prod_product_fk')
                ->restrictOnDelete();
            $table->decimal('dose', 12, 3);
            $table->decimal('pump', 12, 3);
            $table->decimal('area', 14, 3);
            $table->decimal('planned_quantity', 14, 3);
            $table->timestamps();

            $table->unique(
                ['agricultural_defensive_order_id', 'agricultural_defensive_order_operator_id', 'product_id'],
                'ado_op_prod_unique'
            );
            $table->index(['agricultural_defensive_order_operator_id', 'product_id'], 'ado_op_prod_operator_product_idx');
            $table->index(['agricultural_defensive_order_id', 'product_id'], 'ado_op_prod_order_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agricultural_defensive_order_operator_products');
    }
};
