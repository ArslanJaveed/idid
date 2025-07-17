<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; // Use Authenticatable for Sanctum
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Import HasApiTokens trait

class Company extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'companies';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'password',
        'company_name',
        'company_type',
        'custom_company_type',
        'country',
        'city',
        'address',
        'terms_accepted',
        'otp_code',
        'otp_expires_at',
        'is_email_verified',
        'company_code',
        'company_image_url',
        'default_check_in_time',
        'default_check_out_time',
        'late_check_in_grace_period_minutes',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'otp_code', // Hide OTP from API responses
        'otp_expires_at', // Hide OTP expiration from API responses
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'terms_accepted' => 'boolean',
        'is_email_verified' => 'boolean',
        'otp_expires_at' => 'datetime',
    ];

    // Define relationship with Roles
    public function roles()
    {
        return $this->hasMany(Role::class);
    }

    // Define relationship with Employees
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    // Define relationship with Attendance (via employees)
    public function attendance()
    {
        return $this->hasManyThrough(Attendance::class, Employee::class);
    }
}

