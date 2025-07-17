<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CompanyAuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\EmployeeAuthController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\TaskController;
use App\Models\Company; // Import Company model
use App\Models\Employee; // Import Employee model

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Public routes for company registration and authentication
Route::post('/company/register', [CompanyAuthController::class, 'register']);
Route::post('/company/verify-otp', [CompanyAuthController::class, 'verifyOtp']);
Route::post('/company/set-password-code', [CompanyAuthController::class, 'setPasswordAndCompanyCode']);
Route::post('/company/login', [CompanyAuthController::class, 'login']);

// Public routes for employee registration and authentication
Route::post('/employee/verify-invite', [EmployeeAuthController::class, 'verifyInvite']);
Route::post('/employee/complete-profile', [EmployeeAuthController::class, 'completeProfileAndAcceptEnrollment']);
Route::post('/employee/set-password-verify-email', [EmployeeAuthController::class, 'setPasswordAndVerifyEmail']);
Route::post('/employee/verify-otp', [EmployeeAuthController::class, 'verifyOtp']);
Route::post('/employee/login', [EmployeeAuthController::class, 'login']);


// Protected routes for authenticated users (Company OR Employee)
Route::middleware('auth:sanctum')->group(function () {
    // Generic /user endpoint that returns the authenticated model
    Route::get('/user', function (Request $request) {
        $user = $request->user();

        // Eager load relationships specific to the user type if needed for frontend
        // This ensures the frontend gets the full model with distinguishing attributes
        if ($user instanceof Company) {
            // No specific relationships needed for Company on /user normally
            return $user;
        } elseif ($user instanceof Employee) {
            // Eager load role for Employee, as frontend often displays it
            return $user->load('role'); // Ensure 'role' relationship is defined in Employee model
        }
        // Fallback: If for some reason it's neither, return as is.
        // This should ideally not happen if only Company and Employee models are authenticatable.
        return $user;
    });

    // Protected routes for authenticated company admins
    Route::middleware('can:isCompany')->group(function () { // Removed App\Models\Company as second arg
        Route::post('/company/logout', [CompanyAuthController::class, 'logout']); // Specific company logout
        Route::put('/company/settings', [CompanyAuthController::class, 'updateCompanySettings']);

        // Company Admin: Employee Management
        Route::post('/company/employees/add', [EmployeeController::class, 'addEmployee']);
        Route::get('/company/employees', [EmployeeController::class, 'index']);
        Route::get('/company/employees/{employee}', [EmployeeController::class, 'show']);
        Route::put('/company/employees/{employee}', [EmployeeController::class, 'update']);
        Route::delete('/company/employees/{employee}', [EmployeeController::class, 'destroy']);

        // Company Admin: Role Management
        Route::apiResource('company/roles', RoleController::class)->except(['create', 'edit']);

        // Company Admin: View Employee Attendance History
        Route::get('/company/employees/{employee}/attendance-history', [AttendanceController::class, 'getAttendanceHistory']);
    });

    // Protected routes for authenticated employees
    Route::middleware('can:isEmployee')->group(function () { // Removed App\Models\Employee as second arg
        Route::post('/employee/logout', [EmployeeAuthController::class, 'logout']); // Specific employee logout

        // Employee: Daily Workflow
        Route::post('/employee/check-in', [AttendanceController::class, 'checkIn']);
        Route::post('/employee/check-out', [AttendanceController::class, 'checkOut']);
        Route::get('/employee/today-status', [AttendanceController::class, 'getTodayStatus']);
        Route::get('/employee/attendance-history', [AttendanceController::class, 'getAttendanceHistory']); // Employee's own history

        // Employee: Task Management
        Route::post('/employee/tasks/add', [TaskController::class, 'addTask']);
        Route::put('/employee/tasks/{task}/status', [TaskController::class, 'updateTaskStatus']);
        Route::get('/employee/tasks/today', [TaskController::class, 'getTodayTasks']);
        Route::get('/employee/tasks/history/{attendance}', [TaskController::class, 'getHistoricalTasks']);
    });
});
