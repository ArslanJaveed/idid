<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Task;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Employee: Add more tasks for the current day's attendance.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addTask(Request $request)
    {
        $employee = $request->user(); // Authenticated employee

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Find today's active attendance record
        $todayAttendance = Attendance::where('employee_id', $employee->id)
                                    ->whereDate('date', Carbon::today())
                                    ->where('status', 'checked_in')
                                    ->first();

        if (!$todayAttendance) {
            return response()->json(['message' => 'You must be checked in to add tasks.'], 400);
        }

        $validator = Validator::make($request->all(), [
            'description' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task = $todayAttendance->tasks()->create([
            'employee_id' => $employee->id, // Redundant but good for direct queries
            'description' => $request->description,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Task added successfully.',
            'task' => $task
        ], 201);
    }

    /**
     * Employee: Update the status of a specific task.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Task  $task
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateTaskStatus(Request $request, Task $task)
    {
        $employee = $request->user(); // Authenticated employee

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the task belongs to the authenticated employee
        if ($task->employee_id !== $employee->id) {
            return response()->json(['message' => 'Task not found or does not belong to you.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,completed,incomplete',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $task->update(['status' => $request->status]);

        return response()->json([
            'message' => 'Task status updated successfully.',
            'task' => $task
        ], 200);
    }

    /**
     * Employee: Get all tasks for the current day's attendance.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getTodayTasks(Request $request)
    {
        $employee = $request->user();

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $todayAttendance = Attendance::where('employee_id', $employee->id)
                                    ->whereDate('date', Carbon::today())
                                    ->first();

        if (!$todayAttendance) {
            return response()->json(['message' => 'No attendance record for today. Cannot retrieve tasks.'], 404);
        }

        $tasks = $todayAttendance->tasks()->get();

        return response()->json(['tasks' => $tasks], 200);
    }

    /**
     * Employee: Get tasks for a specific historical attendance record.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Attendance  $attendance
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHistoricalTasks(Request $request, Attendance $attendance)
    {
        $employee = $request->user();

        if (!$employee instanceof Employee) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the attendance record belongs to the authenticated employee
        if ($attendance->employee_id !== $employee->id) {
            return response()->json(['message' => 'Attendance record not found or does not belong to you.'], 404);
        }

        $tasks = $attendance->tasks()->get();

        return response()->json(['tasks' => $tasks], 200);
    }
}
