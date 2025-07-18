<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('attendance_id')->constrained('attendance')->onDelete('cascade'); 
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade'); 
            $table->text('description'); 
            $table->enum('status', ['pending', 'completed', 'incomplete'])->default('pending'); 
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};