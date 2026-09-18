<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('operation_defensives', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 255)->unique();
            $table->string('status', 1)->default('A');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('operation_defensives');
    }
};
