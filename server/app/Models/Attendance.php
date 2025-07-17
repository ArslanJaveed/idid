<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'attendance'; // Note: Laravel typically pluralizes, but we used 'attendance'

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'company_id',
        'date',
        'check_in_time',
        'check_out_time',
        'is_absent',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'is_absent' => 'boolean',
    ];

    /**
     * Get the employee that owns the attendance record.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the company associated with this attendance record.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the tasks associated with this attendance record.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}

