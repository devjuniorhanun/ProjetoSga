<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_stations', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 50)->unique();
            $table->char('station_type', 1)->default('F'); // F = físico; M = móvel.
            $table->char('status', 1)->default('A');
            $table->string('description', 500)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['station_type', 'status'], 'fst_type_status_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_stations'); }
};
