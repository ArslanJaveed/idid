<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Company;
use App\Models\Attendance;
use App\Models\Task; // To mark tasks as incomplete on checkout
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon; // For date and time manipulation

class AttendanceController extends Controller
{
    /**
     * Employee: Handle check-in.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkIn(Request $request)
    {
        $employee = $request->user(); // Authenticated employee

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized. Only employees can check in.'], 403);
        }

        // Check if employee is already checked in for today
        $todayAttendance = Attendance::where('employee_id', $employee->id)
                                    ->whereDate('date', Carbon::today())
                                    ->first();

        if ($todayAttendance && $todayAttendance->status === 'checked_in') {
            return response()->json(['message' => 'You are already checked in for today.'], 409);
        }

        // Validate tasks provided during check-in
        $validator = Validator::make($request->all(), [
            'tasks' => 'nullable|array',
            'tasks.*.description' => 'required_with:tasks|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Get company's default check-in time and grace period
        $company = $employee->company;
        $defaultCheckInTime = $company->default_check_in_time ? Carbon::parse($company->default_check_in_time) : null;
        $gracePeriodMinutes = $company->late_check_in_grace_period_minutes ?? 0;

        $checkInTime = Carbon::now();
        $isAbsent = false;

        // Check for late check-in if default time is set
        if ($defaultCheckInTime) {
            $allowedCheckInUntil = (clone $defaultCheckInTime)->addMinutes($gracePeriodMinutes);
            if ($checkInTime->greaterThan($allowedCheckInUntil)) {
                $isAbsent = true;
            }
        }

        // Create attendance record
        $attendance = Attendance::create([
            'employee_id' => $employee->id,
            'company_id' => $employee->company_id,
            'date' => Carbon::today(),
            'check_in_time' => $checkInTime,
            'is_absent' => $isAbsent,
            'status' => 'checked_in',
        ]);

        // Add initial tasks if provided
        if ($request->has('tasks')) {
            foreach ($request->tasks as $taskData) {
                $attendance->tasks()->create([
                    'employee_id' => $employee->id,
                    'description' => $taskData['description'],
                    'status' => 'pending',
                ]);
            }
        }

        return response()->json([
            'message' => $isAbsent ? 'Checked in late. You are marked as absent for today.' : 'Checked in successfully.',
            'attendance' => $attendance->load('tasks'), // Load tasks for immediate display
            'is_absent' => $isAbsent,
        ], 201);
    }

    /**
     * Employee: Handle check-out.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function checkOut(Request $request)
    {
        $employee = $request->user(); // Authenticated employee

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $todayAttendance = Attendance::where('employee_id', $employee->id)
                                    ->whereDate('date', Carbon::today())
                                    ->where('status', 'checked_in')
                                    ->first();

        if (!$todayAttendance) {
            return response()->json(['message' => 'You are not checked in for today.'], 400);
        }

        // Validate tasks completion status provided during checkout
        $validator = Validator::make($request->all(), [
            'task_statuses' => 'required|array', // Array of {task_id: boolean_is_completed}
            'task_statuses.*' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update tasks based on provided completion status
        $tasks = $todayAttendance->tasks()->get();
        foreach ($tasks as $task) {
            if (isset($request->task_statuses[$task->id])) {
                $task->update([
                    'status' => $request->task_statuses[$task->id] ? 'completed' : 'incomplete'
                ]);
            } else {
                // If a task is not in the provided list, mark it as incomplete
                $task->update(['status' => 'incomplete']);
            }
        }

        // Update attendance record
        $todayAttendance->update([
            'check_out_time' => Carbon::now(),
            'status' => 'checked_out',
        ]);

        // TODO: Logic to send daily data to company admin email (can be a separate job/event)
        // This would typically involve dispatching a job:
        // Dispatch a job to send daily report email
        // SendDailyReportEmail::dispatch($todayAttendance->id);

        return response()->json([
            'message' => 'Checked out successfully. Tasks updated.',
            'attendance' => $todayAttendance->load('tasks'),
        ], 200);
    }

    /**
     * Employee: Get today's attendance status and tasks.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTodayStatus(Request $request)
    {
        $employee = $request->user();

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $todayAttendance = Attendance::where('employee_id', $employee->id)
                                    ->whereDate('date', Carbon::today())
                                    ->with('tasks')
                                    ->first();

        $status = 'not_checked_in';
        if ($todayAttendance) {
            $status = $todayAttendance->status;
        }

        return response()->json([
            'today_attendance' => $todayAttendance,
            'status' => $status,
            'message' => $todayAttendance ? 'Today\'s attendance details retrieved.' : 'No attendance record for today yet.'
        ], 200);
    }

    /**
     * Employee: Get historical attendance records with tasks.
     * Company Admin: Get historical attendance for a specific employee.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Employee|null  $employee (for admin view)
     * @return \Illuminate\Http\JsonResponse
     */
    public function getAttendanceHistory(Request $request, Employee $employee = null)
    {
        $user = $request->user(); // Authenticated user (Employee or Company)

        $query = Attendance::query()->with('tasks', 'employee.company');

        if ($user instanceof Employee) {
            // Employee viewing their own history
            $query->where('employee_id', $user->id);
        } elseif ($user instanceof Company) {
            // Company admin viewing specific employee's history
            if (!$employee || $employee->company_id !== $user->id) {
                return response()->json(['message' => 'Employee not found or does not belong to your company.'], 404);
            }
            $query->where('employee_id', $employee->id);
        } else {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Optional: Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $attendanceHistory = $query->orderBy('date', 'desc')->get();

        return response()->json(['attendance_history' => $attendanceHistory], 200);
    }
}
