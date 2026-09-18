<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('farm_state_registrations', function (Blueprint $table): void {
            $table->foreignId('culture_id')->nullable()->change();
            $table->index(['producer_id', 'farm_id', 'status'], 'farm_state_reg_no_culture_search');
        });
    }

    public function down(): void
    {
        Schema::table('farm_state_registrations', function (Blueprint $table): void {
            $table->dropIndex('farm_state_reg_no_culture_search');
        });
    }
};
