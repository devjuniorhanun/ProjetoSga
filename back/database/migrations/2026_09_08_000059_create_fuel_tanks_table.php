<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('fuel_tanks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fuel_station_id')->constrained('fuel_stations')->restrictOnDelete();
            $table->string('name', 100);
            $table->string('code', 50);
            $table->decimal('capacity', 14, 3)->nullable();
            $table->char('status', 1)->default('A');
            $table->string('description', 500)->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique(['fuel_station_id','code'], 'ft_station_code_uq');
            $table->index('fuel_station_id', 'ft_station_idx');
        });
    }
    public function down(): void { Schema::dropIfExists('fuel_tanks'); }
};
