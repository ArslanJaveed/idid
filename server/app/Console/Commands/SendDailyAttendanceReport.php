<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Company;
use App\Models\Attendance;
use Illuminate\Support\Facades\Mail;
use App\Mail\DailyAttendanceReportMail; // We'll create this mail class next
use Carbon\Carbon;

class SendDailyAttendanceReport extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'report:daily-attendance';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sends daily attendance and task reports to company admins.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting daily attendance report generation...');

        // Get yesterday's date
        $reportDate = Carbon::yesterday()->toDateString();

        // Fetch all companies
        $companies = Company::all();

        foreach ($companies as $company) {
            $this->info("Processing company: {$company->company_name} (ID: {$company->id}) for date {$reportDate}");

            // Get all employees for the current company
            $employees = $company->employees;

            $reportData = [];
            $totalPresent = 0;
            $totalAbsent = 0;

            foreach ($employees as $employee) {
                // Get attendance for the specific employee for the report date
                $attendance = Attendance::where('employee_id', $employee->id)
                                        ->whereDate('date', $reportDate)
                                        ->with('tasks') // Load tasks associated with this attendance
                                        ->first();

                $employeeStatus = 'Not Checked In';
                $checkIn = null;
                $checkOut = null;
                $tasks = [];
                $isAbsent = false;

                if ($attendance) {
                    $checkIn = $attendance->check_in_time ? Carbon::parse($attendance->check_in_time)->format('H:i:s') : 'N/A';
                    $checkOut = $attendance->check_out_time ? Carbon::parse($attendance->check_out_time)->format('H:i:s') : 'N/A';
                    $isAbsent = $attendance->is_absent;
                    $employeeStatus = $isAbsent ? 'Absent (Late Check-in)' : ($attendance->status === 'checked_out' ? 'Present' : 'Checked In (No Checkout)');

                    if ($isAbsent) {
                        $totalAbsent++;
                    } else {
                        $totalPresent++;
                    }

                    foreach ($attendance->tasks as $task) {
                        $tasks[] = [
                            'description' => $task->description,
                            'status' => $task->status,
                        ];
                    }
                } else {
                    // If no attendance record, employee is absent
                    $employeeStatus = 'Absent (No Check-in)';
                    $isAbsent = true;
                    $totalAbsent++;
                }

                $reportData[] = [
                    'employee_name' => $employee->name,
                    'employee_id_code' => $employee->employee_id_code,
                    'role' => $employee->role->role_name ?? 'N/A', // Assuming role is loaded or accessible
                    'status' => $employeeStatus,
                    'check_in_time' => $checkIn,
                    'check_out_time' => $checkOut,
                    'tasks' => $tasks,
                ];
            }

            // Only send email if there are employees or relevant data
            if (!empty($reportData)) {
                try {
                    Mail::to($company->email)->send(new DailyAttendanceReportMail(
                        $company->company_name,
                        $reportDate,
                        $reportData,
                        $totalPresent,
                        $totalAbsent
                    ));
                    $this->info("Daily report sent to {$company->email} for {$reportDate}.");
                } catch (\Exception $e) {
                    $this->error("Failed to send daily report to {$company->email}: " . $e->getMessage());
                }
            } else {
                $this->info("No employees or attendance data for {$company->company_name} on {$reportDate}. Skipping email.");
            }
        }

        $this->info('Daily attendance report generation completed.');
    }
}
