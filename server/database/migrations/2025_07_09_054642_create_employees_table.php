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
        Schema::create('employees', function (Blueprint $table) {
            $table->id(); 
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade'); 
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade'); 
            $table->string('employee_id_code'); 
            $table->string('name'); 
            $table->string('cnic', 20)->unique(); 
            $table->string('email')->unique(); 
            $table->string('password')->nullable(); 
            $table->enum('status', ['pending_invite', 'invited', 'active', 'inactive'])->default('pending_invite'); 
            $table->boolean('is_email_verified')->default(false); 
            $table->string('profile_image_url', 2048)->nullable(); 
            $table->boolean('enrolment_accepted')->default(false); 
            $table->timestamps(); 

    
            $table->unique(['company_id', 'employee_id_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};