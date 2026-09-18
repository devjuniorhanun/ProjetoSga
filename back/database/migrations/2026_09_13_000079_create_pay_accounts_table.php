<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pay_accounts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('administrative_center_id')->constrained()->restrictOnDelete();
            $table->foreignId('cost_center_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->foreignId('producer_id')->constrained()->restrictOnDelete();
            $table->foreignId('type_pay_account_id')->constrained()->restrictOnDelete();
            $table->foreignId('crop_id')->constrained()->restrictOnDelete();
            $table->string('document_number');
            $table->date('document_date');
            $table->date('due_date');
            $table->text('description');
            $table->decimal('value', 10, 2);
            $table->string('accounted_for', 1)->default('N');
            $table->string('status', 2)->default('RI');
            $table->string('entry_type', 30)->default('ACCOUNT');
            $table->string('source_type', 120)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['document_date', 'entry_type']);
            $table->index(['type_pay_account_id', 'document_date']);
            $table->index(['producer_id', 'administrative_center_id']);
            $table->index(['crop_id', 'document_date']);
            $table->index(['source_type', 'source_id'], 'pay_account_source');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pay_accounts');
    }
};
