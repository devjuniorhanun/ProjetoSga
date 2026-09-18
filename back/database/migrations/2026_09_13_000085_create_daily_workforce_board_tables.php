<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('daily_workforce_boards', function (Blueprint $table): void {
            $table->id();
            $table->date('work_date')->unique('workforce_board_date_uq');
            $table->unsignedInteger('version')->default(1);
            $table->text('notes')->nullable();
            $table->char('status', 1)->default('A');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('daily_board_operations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('daily_workforce_board_id')->constrained('daily_workforce_boards', 'id', 'board_operation_board_fk')->cascadeOnDelete();
            $table->string('source_type', 20)->default('MANUAL');
            $table->unsignedBigInteger('source_id')->nullable();
            $table->foreignId('agricultural_service_type_id')->nullable()->constrained('agricultural_service_types', 'id', 'board_operation_type_fk')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedInteger('required_employees')->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->char('status', 1)->default('A');
            $table->json('source_snapshot')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['daily_workforce_board_id', 'display_order'], 'board_operation_order_idx');
            $table->index(['source_type', 'source_id'], 'board_operation_source_idx');
        });

        Schema::create('employee_allocations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('daily_workforce_board_id')->constrained('daily_workforce_boards', 'id', 'employee_allocation_board_fk')->cascadeOnDelete();
            $table->foreignId('daily_board_operation_id')->constrained('daily_board_operations', 'id', 'employee_allocation_operation_fk')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->unsignedInteger('display_order')->default(0);
            $table->text('notes')->nullable();
            $table->foreignId('allocated_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('allocated_at');
            $table->timestamps();
            $table->unique(['daily_workforce_board_id', 'supplier_id'], 'employee_allocation_day_uq');
        });

        Schema::create('employee_allocation_histories', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('daily_workforce_board_id')->constrained('daily_workforce_boards', 'id', 'allocation_history_board_fk')->cascadeOnDelete();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->foreignId('from_operation_id')->nullable()->constrained('daily_board_operations', 'id', 'allocation_history_from_fk')->nullOnDelete();
            $table->foreignId('to_operation_id')->nullable()->constrained('daily_board_operations', 'id', 'allocation_history_to_fk')->nullOnDelete();
            $table->string('action', 20);
            $table->unsignedInteger('save_version');
            $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('changed_at');
            $table->json('snapshot')->nullable();
            $table->index(['daily_workforce_board_id', 'save_version'], 'allocation_history_version_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_allocation_histories');
        Schema::dropIfExists('employee_allocations');
        Schema::dropIfExists('daily_board_operations');
        Schema::dropIfExists('daily_workforce_boards');
    }
};
