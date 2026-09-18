<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grain_document_sequences', function (Blueprint $table): void {
            $table->id();
            $table->string('document_type', 30);
            $table->unsignedSmallInteger('year');
            $table->unsignedBigInteger('last_number')->default(0);
            $table->timestamps();
            $table->unique(['document_type', 'year'], 'grain_document_sequence_unique');
        });

        Schema::create('grain_authorization_requests', function (Blueprint $table): void {
            $table->id();
            $table->string('request_number', 30)->unique();
            $table->string('operation_type', 60);
            $table->string('resource_type', 100)->nullable();
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->foreignId('requested_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('requested_at');
            $table->text('reason');
            $table->json('payload_before')->nullable();
            $table->json('payload_requested');
            $table->string('status', 20)->default('PENDING');
            $table->foreignId('authorized_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('authorized_at')->nullable();
            $table->text('authorization_reason')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->index(['resource_type', 'resource_id'], 'grain_auth_resource_search');
            $table->index(['status', 'operation_type'], 'grain_auth_status_search');
        });

        Schema::create('grain_scale_readings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_scale_id')->constrained('grain_scales')->restrictOnDelete();
            $table->foreignId('grain_scale_channel_id')->constrained('grain_scale_channels')->restrictOnDelete();
            $table->string('node_code', 50);
            $table->unsignedBigInteger('sequence');
            $table->decimal('weight', 14, 3);
            $table->string('unit', 10)->default('kg');
            $table->boolean('stable');
            $table->text('raw_message')->nullable();
            $table->timestamp('read_at');
            $table->timestamps();
            $table->unique(['node_code', 'sequence'], 'grain_scale_reading_idempotency');
            $table->index(['grain_scale_channel_id', 'read_at'], 'grain_scale_reading_search');
        });

        Schema::create('grain_weighing_tickets', function (Blueprint $table): void {
            $table->id();
            $table->string('ticket_number', 30)->unique();
            $table->string('operation_type', 30);
            $table->string('flow_type', 10)->default('DOUBLE');
            $table->string('ownership_type', 2)->default('OW');
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_state_registration_id')->constrained('farm_state_registrations')->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->foreignId('buyer_id')->nullable()->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('grain_warehouse_id')->constrained('grain_warehouses')->restrictOnDelete();
            $table->foreignId('grain_storage_location_id')->constrained('grain_storage_locations')->restrictOnDelete();
            $table->foreignId('grain_transport_driver_id')->nullable()->constrained('grain_transport_drivers')->restrictOnDelete();
            $table->foreignId('grain_transport_truck_id')->constrained('grain_transport_trucks')->restrictOnDelete();
            $table->foreignId('first_scale_id')->nullable()->constrained('grain_scales')->restrictOnDelete();
            $table->foreignId('first_scale_channel_id')->nullable()->constrained('grain_scale_channels')->restrictOnDelete();
            $table->foreignId('first_reading_id')->nullable()->constrained('grain_scale_readings')->restrictOnDelete();
            $table->decimal('first_weight', 14, 3)->nullable();
            $table->timestamp('first_weight_at')->nullable();
            $table->string('first_weight_source', 20)->nullable();
            $table->foreignId('second_scale_id')->nullable()->constrained('grain_scales')->restrictOnDelete();
            $table->foreignId('second_scale_channel_id')->nullable()->constrained('grain_scale_channels')->restrictOnDelete();
            $table->foreignId('second_reading_id')->nullable()->constrained('grain_scale_readings')->restrictOnDelete();
            $table->decimal('second_weight', 14, 3)->nullable();
            $table->timestamp('second_weight_at')->nullable();
            $table->string('second_weight_source', 20)->nullable();
            $table->decimal('gross_weight', 14, 3)->nullable();
            $table->decimal('tare_weight', 14, 3)->nullable();
            $table->decimal('net_weight', 14, 3)->nullable();
            $table->decimal('quality_discount_weight', 14, 3)->default(0);
            $table->decimal('commercial_net_weight', 14, 3)->nullable();
            $table->string('status', 40)->default('WAITING_FIRST_WEIGHT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('closed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('canceled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->string('verification_code', 64)->nullable()->unique();
            $table->timestamps();
            $table->index(['grain_transport_truck_id', 'status'], 'grain_ticket_truck_status');
            $table->index(['producer_id', 'culture_id', 'crop_id'], 'grain_ticket_stock_search');
        });

        Schema::create('grain_entry_discounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_weighing_ticket_id')->constrained('grain_weighing_tickets')->cascadeOnDelete();
            $table->foreignId('grain_discount_type_id')->constrained('grain_discount_types')->restrictOnDelete();
            $table->decimal('percentage', 9, 5)->default(0);
            $table->decimal('discount_weight', 14, 3)->nullable();
            $table->boolean('is_extra_discount')->default(false);
            $table->text('justification')->nullable();
            $table->foreignId('informed_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('authorization_request_id')->nullable()->constrained('grain_authorization_requests')->restrictOnDelete();
            $table->string('formula_version')->nullable();
            $table->json('calculation_snapshot')->nullable();
            $table->timestamps();
            $table->unique(['grain_weighing_ticket_id', 'grain_discount_type_id'], 'grain_entry_discount_unique');
        });

        Schema::create('grain_balances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_state_registration_id')->constrained('farm_state_registrations')->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->string('ownership_type', 2);
            $table->decimal('physical_balance', 16, 3)->default(0);
            $table->decimal('pending_impurity_weight', 16, 3)->default(0);
            $table->decimal('commercial_balance', 16, 3)->default(0);
            $table->decimal('contract_balance', 16, 3)->default(0);
            $table->decimal('estimated_technical_reserve', 16, 3)->default(0);
            $table->timestamps();
            $table->unique(['producer_id', 'farm_state_registration_id', 'crop_id', 'culture_id', 'ownership_type'], 'grain_balance_unique');
        });

        Schema::create('grain_sale_contracts', function (Blueprint $table): void {
            $table->id();
            $table->string('contract_number', 100);
            $table->foreignId('buyer_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('farm_state_registration_id')->constrained('farm_state_registrations')->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->foreignId('culture_id')->constrained()->restrictOnDelete();
            $table->string('ownership_type', 2)->default('OW');
            $table->date('contract_date')->nullable();
            $table->date('start_date')->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('contracted_weight', 16, 3);
            $table->decimal('tolerance_percentage', 8, 5)->default(0);
            $table->decimal('transferred_weight', 16, 3)->default(0);
            $table->decimal('shipped_weight', 16, 3)->default(0);
            $table->string('status', 20)->default('DRAFT');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['buyer_id', 'contract_number'], 'grain_contract_buyer_number_unique');
            $table->index(['buyer_id', 'producer_id', 'culture_id', 'crop_id', 'status'], 'grain_contract_search');
        });

        Schema::create('grain_contract_transfers', function (Blueprint $table): void {
            $table->id();
            $table->string('transfer_number', 30)->unique();
            $table->foreignId('grain_balance_id')->constrained('grain_balances')->restrictOnDelete();
            $table->foreignId('origin_contract_id')->nullable()->constrained('grain_sale_contracts')->restrictOnDelete();
            $table->foreignId('destination_contract_id')->constrained('grain_sale_contracts')->restrictOnDelete();
            $table->decimal('weight', 16, 3);
            $table->string('transfer_type', 30)->default('BALANCE_TO_CONTRACT');
            $table->string('status', 20)->default('CONFIRMED');
            $table->text('reason')->nullable();
            $table->foreignId('authorization_request_id')->nullable()->constrained('grain_authorization_requests')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('confirmed_at')->nullable();
            $table->foreignId('canceled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('canceled_at')->nullable();
            $table->text('cancellation_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('grain_shipment_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_weighing_ticket_id')->constrained('grain_weighing_tickets')->cascadeOnDelete();
            $table->foreignId('grain_sale_contract_id')->constrained('grain_sale_contracts')->restrictOnDelete();
            $table->string('subticket_number', 40)->unique();
            $table->decimal('allocated_weight', 16, 3);
            $table->foreignId('authorization_request_id')->nullable()->constrained('grain_authorization_requests')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['grain_weighing_ticket_id', 'grain_sale_contract_id'], 'grain_shipment_contract_unique');
        });

        Schema::create('grain_stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->string('movement_number', 30)->unique();
            $table->foreignId('grain_balance_id')->constrained('grain_balances')->restrictOnDelete();
            $table->foreignId('grain_weighing_ticket_id')->nullable()->constrained('grain_weighing_tickets')->restrictOnDelete();
            $table->foreignId('grain_sale_contract_id')->nullable()->constrained('grain_sale_contracts')->restrictOnDelete();
            $table->string('movement_type', 40);
            $table->decimal('physical_quantity', 16, 3)->default(0);
            $table->decimal('commercial_quantity', 16, 3)->default(0);
            $table->decimal('physical_balance_before', 16, 3);
            $table->decimal('physical_balance_after', 16, 3);
            $table->decimal('commercial_balance_before', 16, 3);
            $table->decimal('commercial_balance_after', 16, 3);
            $table->string('source_type', 100)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->foreignId('reversal_of_id')->nullable()->constrained('grain_stock_movements')->restrictOnDelete();
            $table->text('reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('occurred_at');
            $table->timestamps();
            $table->index(['grain_balance_id', 'occurred_at'], 'grain_stock_movement_search');
        });

        Schema::create('grain_impurity_outputs', function (Blueprint $table): void {
            $table->id();
            $table->string('output_number', 30)->unique();
            $table->foreignId('grain_weighing_ticket_id')->unique()->constrained('grain_weighing_tickets')->restrictOnDelete();
            $table->string('operator_name');
            $table->string('vehicle_description')->nullable();
            $table->string('destination')->nullable();
            $table->string('status', 20)->default('OPEN');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();
        });

        Schema::create('grain_impurity_output_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('grain_impurity_output_id')->constrained('grain_impurity_outputs')->cascadeOnDelete();
            $table->foreignId('grain_impurity_type_id')->constrained('grain_impurity_types')->restrictOnDelete();
            $table->foreignId('source_entry_ticket_id')->constrained('grain_weighing_tickets')->restrictOnDelete();
            $table->decimal('quantity', 16, 3);
            $table->timestamps();
        });

        Schema::create('grain_technical_losses', function (Blueprint $table): void {
            $table->id();
            $table->string('loss_number', 30)->unique();
            $table->foreignId('grain_balance_id')->constrained('grain_balances')->restrictOnDelete();
            $table->foreignId('grain_technical_loss_config_id')->constrained('grain_technical_loss_configs')->restrictOnDelete();
            $table->unsignedSmallInteger('reference_year');
            $table->unsignedTinyInteger('reference_month');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('monthly_percentage', 8, 5);
            $table->decimal('average_daily_balance', 16, 3);
            $table->decimal('calculated_loss', 16, 3);
            $table->decimal('applied_loss', 16, 3);
            $table->decimal('balance_before', 16, 3);
            $table->decimal('balance_after', 16, 3);
            $table->json('daily_balance_snapshot');
            $table->json('configuration_snapshot');
            $table->foreignId('processed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('processed_at');
            $table->foreignId('reversed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reversed_at')->nullable();
            $table->foreignId('authorization_request_id')->nullable()->constrained('grain_authorization_requests')->restrictOnDelete();
            $table->timestamps();
            $table->unique(['grain_balance_id', 'reference_year', 'reference_month'], 'grain_technical_loss_period_unique');
        });

        Schema::create('grain_balance_assignments', function (Blueprint $table): void {
            $table->id();
            $table->string('assignment_number', 30)->unique();
            $table->foreignId('origin_grain_balance_id')->constrained('grain_balances')->restrictOnDelete();
            $table->foreignId('destination_grain_balance_id')->constrained('grain_balances')->restrictOnDelete();
            $table->decimal('weight', 16, 3);
            $table->text('reason');
            $table->foreignId('authorization_request_id')->constrained('grain_authorization_requests')->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('confirmed_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grain_balance_assignments');
        Schema::dropIfExists('grain_technical_losses');
        Schema::dropIfExists('grain_impurity_output_items');
        Schema::dropIfExists('grain_impurity_outputs');
        Schema::dropIfExists('grain_stock_movements');
        Schema::dropIfExists('grain_shipment_allocations');
        Schema::dropIfExists('grain_contract_transfers');
        Schema::dropIfExists('grain_sale_contracts');
        Schema::dropIfExists('grain_balances');
        Schema::dropIfExists('grain_entry_discounts');
        Schema::dropIfExists('grain_weighing_tickets');
        Schema::dropIfExists('grain_scale_readings');
        Schema::dropIfExists('grain_authorization_requests');
        Schema::dropIfExists('grain_document_sequences');
    }
};
