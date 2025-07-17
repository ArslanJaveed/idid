<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Employee extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'employees';

    protected $fillable = [
        'company_id',
        'role_id',
        'employee_id_code',
        'name',
        'cnic',
        'email',
        'password',
        'status',
        'is_email_verified',
        'profile_image_url',
        'enrolment_accepted',
        'invite_token',
        'otp_code', // <--- Add this line
        'otp_expires_at', // <--- Add this line
    ];

    protected $hidden = [
        'password',
        'invite_token',
        'otp_code', // <--- Hide OTP from API responses
        'otp_expires_at', // <--- Hide OTP expiration from API responses
    ];

    protected $casts = [
        'is_email_verified' => 'boolean',
        'enrolment_accepted' => 'boolean',
        'otp_expires_at' => 'datetime', // <--- Cast as datetime
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}

