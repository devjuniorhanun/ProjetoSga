<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entry_invoices', function (Blueprint $table): void {
            $table->id();
            $table->string('entry_type', 30);
            $table->string('entry_method', 30)->default('MANUAL');
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('administrative_center_id')->constrained('administrative_centers')->restrictOnDelete();
            $table->foreignId('cost_center_id')->constrained('cost_centers')->restrictOnDelete();
            $table->foreignId('crop_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
            $table->string('access_key', 44)->nullable()->unique();
            $table->string('document_model', 10)->default('55');
            $table->string('invoice_number', 100);
            $table->string('series', 20)->default('');
            $table->date('issue_date');
            $table->date('entry_date');
            $table->string('operation_nature')->nullable();
            $table->decimal('products_value', 18, 2)->default(0);
            $table->decimal('freight_value', 18, 2)->default(0);
            $table->decimal('insurance_value', 18, 2)->default(0);
            $table->decimal('discount_value', 18, 2)->default(0);
            $table->decimal('other_expenses_value', 18, 2)->default(0);
            $table->decimal('invoice_total', 18, 2)->default(0);
            $table->string('freight_responsibility', 30)->default('NO_FREIGHT');
            $table->text('observation')->nullable();
            $table->string('status', 30)->default('DRAFT');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('canceled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['supplier_id', 'invoice_number', 'series'], 'entry_invoice_supplier_number');
            $table->index(['entry_type', 'status', 'entry_date'], 'entry_invoice_search');
        });

        Schema::create('entry_invoice_import_batches', function (Blueprint $table): void {
            $table->id();
            $table->string('file_name');
            $table->string('file_hash', 64)->unique();
            $table->string('status', 30)->default('PENDING');
            $table->json('document_snapshot')->nullable();
            $table->json('warnings')->nullable();
            $table->foreignId('entry_invoice_id')->nullable()->constrained('entry_invoices')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('entry_invoice_import_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('entry_invoice_import_batch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('supplier_product_code', 100);
            $table->string('description');
            $table->string('ean', 30)->nullable();
            $table->string('ncm', 20)->nullable();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_product_id')->nullable()->constrained('supplier_products')->nullOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->decimal('unit_value', 16, 6);
            $table->string('status', 30)->default('UNMATCHED');
            $table->foreignId('linked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('linked_at')->nullable();
            $table->timestamps();
        });

        Schema::create('entry_invoice_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('entry_invoice_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_product_id')->nullable()->constrained('supplier_products')->nullOnDelete();
            $table->unsignedInteger('item_number');
            $table->string('supplier_product_code', 100)->nullable();
            $table->string('description');
            $table->string('ncm', 20)->nullable();
            $table->string('cfop', 10)->nullable();
            $table->string('unit', 20);
            $table->decimal('quantity', 16, 3);
            $table->decimal('unit_value', 16, 6);
            $table->decimal('gross_value', 18, 2);
            $table->decimal('discount_value', 18, 2)->default(0);
            $table->decimal('freight_value', 18, 2)->default(0);
            $table->decimal('other_expenses_value', 18, 2)->default(0);
            $table->decimal('total_value', 18, 2);
            $table->decimal('returned_quantity', 16, 3)->default(0);
            $table->string('status', 30)->default('ACTIVE');
            $table->timestamps();
            $table->unique(['entry_invoice_id', 'item_number'], 'entry_invoice_item_number');
        });

        Schema::create('entry_invoice_stock_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('entry_invoice_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('stock_location_id')->constrained()->restrictOnDelete();
            $table->foreignId('plot_field_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('fuel_station_id')->nullable()->constrained('fuel_stations')->nullOnDelete();
            $table->string('batch', 100)->default('');
            $table->date('manufacturing_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('quantity', 16, 3);
            $table->timestamps();
        });

        Schema::create('entry_invoice_seed_lots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('entry_invoice_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->foreignId('variety_culture_id')->constrained('variety_cultures')->restrictOnDelete();
            $table->foreignId('stock_location_id')->constrained()->restrictOnDelete();
            $table->string('lot_number', 100);
            $table->string('sieve', 50);
            $table->decimal('quantity', 16, 3);
            $table->string('unit', 20);
            $table->decimal('package_quantity', 16, 3)->nullable();
            $table->decimal('quantity_per_package', 16, 3)->nullable();
            $table->date('manufacturing_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('germination_percentage', 8, 3)->nullable();
            $table->decimal('purity_percentage', 8, 3)->nullable();
            $table->timestamps();
            $table->unique(['entry_invoice_item_id', 'lot_number', 'variety_culture_id', 'stock_location_id'], 'entry_seed_lot_unique');
        });

        Schema::create('entry_invoice_installments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('entry_invoice_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('installment_number');
            $table->string('document_number', 255);
            $table->date('due_date');
            $table->decimal('value', 18, 2);
            $table->foreignId('pay_account_id')->nullable()->constrained('pay_accounts')->nullOnDelete();
            $table->timestamps();
            $table->unique(['entry_invoice_id', 'installment_number'], 'entry_invoice_installment_unique');
        });

        Schema::create('freight_rates', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('carrier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->decimal('value_per_ton', 16, 6);
            $table->date('effective_from');
            $table->date('effective_until')->nullable();
            $table->char('status', 1)->default('A');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('invoice_freights', function (Blueprint $table): void {
            $table->id();
            $table->string('freight_number', 40)->unique();
            $table->foreignId('entry_invoice_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('carrier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('freight_rate_id')->nullable()->constrained()->nullOnDelete();
            $table->string('driver_name')->nullable();
            $table->string('driver_cpf', 14)->nullable();
            $table->string('driver_phone', 30)->nullable();
            $table->string('vehicle_plate', 10)->nullable();
            $table->decimal('invoice_weight', 16, 3);
            $table->decimal('value_per_ton', 16, 6);
            $table->decimal('total_freight_value', 18, 2);
            $table->decimal('paid_value', 18, 2)->default(0);
            $table->string('status', 30)->default('OPEN');
            $table->json('rate_snapshot')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->index(['carrier_id', 'product_id', 'status'], 'invoice_freight_payment_search');
        });

        Schema::create('freight_payments', function (Blueprint $table): void {
            $table->id();
            $table->string('payment_number', 40)->unique();
            $table->foreignId('carrier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('administrative_center_id')->constrained('administrative_centers')->restrictOnDelete();
            $table->foreignId('cost_center_id')->constrained('cost_centers')->restrictOnDelete();
            $table->string('payment_method', 2);
            $table->string('document_number', 255);
            $table->date('document_date');
            $table->date('due_date');
            $table->decimal('total_value', 18, 2);
            $table->foreignId('pay_account_id')->nullable()->constrained('pay_accounts')->nullOnDelete();
            $table->string('status', 20)->default('CONFIRMED');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('freight_payment_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('freight_payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('invoice_freight_id')->constrained()->restrictOnDelete();
            $table->decimal('value', 18, 2);
            $table->decimal('balance_before', 18, 2);
            $table->decimal('balance_after', 18, 2);
            $table->timestamps();
        });

        Schema::create('purchase_returns', function (Blueprint $table): void {
            $table->id();
            $table->string('return_number', 40)->unique();
            $table->foreignId('entry_invoice_id')->constrained()->restrictOnDelete();
            $table->date('return_date');
            $table->text('reason');
            $table->decimal('total_value', 18, 2)->default(0);
            $table->string('status', 20)->default('DRAFT');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_return_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('purchase_return_id')->constrained()->cascadeOnDelete();
            $table->foreignId('entry_invoice_item_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_stock_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->decimal('unit_value', 16, 6);
            $table->decimal('total_value', 18, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['purchase_return_items','purchase_returns','freight_payment_items','freight_payments','invoice_freights','freight_rates','entry_invoice_installments','entry_invoice_seed_lots','entry_invoice_stock_allocations','entry_invoice_items','entry_invoice_import_items','entry_invoice_import_batches','entry_invoices'] as $table) Schema::dropIfExists($table);
    }
};
