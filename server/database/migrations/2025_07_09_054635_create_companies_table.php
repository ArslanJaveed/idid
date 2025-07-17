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
        Schema::create('companies', function (Blueprint $table) {
            $table->id(); 
            $table->string('email')->unique(); 
            $table->string('password'); 
            $table->string('company_name'); 
            $table->string('company_type'); 
            $table->string('custom_company_type')->nullable(); 
            $table->string('country'); 
            $table->string('city'); 
            $table->text('address'); 
            $table->boolean('terms_accepted')->default(false); 
            $table->string('otp_code', 6)->nullable(); 
            $table->timestamp('otp_expires_at')->nullable(); 
            $table->boolean('is_email_verified')->default(false); 
            $table->string('company_code', 4)->nullable()->unique();
            $table->string('company_website')->nullable(); 
            $table->string('company_phone')->nullable(); 
            $table->string('company_image_url', 2048)->nullable(); 
            $table->time('default_check_in_time')->nullable();
            $table->time('default_check_out_time')->nullable(); 
            $table->integer('late_check_in_grace_period_minutes')->default(0); 
            $table->timestamps(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};