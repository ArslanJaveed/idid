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
        Schema::create('attendance', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade'); 
            $table->date('date'); 
            $table->dateTime('check_in_time'); 
            $table->dateTime('check_out_time')->nullable(); 
            $table->boolean('is_absent')->default(false); 
            $table->enum('status', ['checked_in', 'checked_out', 'absent', 'present'])->default('checked_in'); 
            $table->timestamps();

           
            $table->unique(['employee_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance');
    }
};