<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Attendance Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #0056b3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .summary {
            margin-top: 20px;
            padding: 15px;
            background-color: #e9f7ef;
            border-left: 5px solid #28a745;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777;
        }
        .task-list {
            list-style-type: none;
            padding-left: 0;
        }
        .task-list li {
            margin-bottom: 5px;
        }
        .task-status-completed {
            color: green;
            font-weight: bold;
        }
        .task-status-incomplete {
            color: orange;
            font-weight: bold;
        }
        .task-status-pending {
            color: gray;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Daily Attendance Report for {{ $companyName }}</h1>
            <p><strong>Date:</strong> {{ $reportDate }}</p>
        </div>

        <div class="summary">
            <p><strong>Summary:</strong></p>
            <p>Total Employees Present: {{ $totalPresent }}</p>
            <p>Total Employees Absent: {{ $totalAbsent }}</p>
        </div>

        @if(empty($reportData))
            <p>No attendance records found for this date.</p>
        @else
            <table>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Employee ID</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Tasks</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($reportData as $employeeData)
                        <tr>
                            <td>{{ $employeeData['employee_name'] }}</td>
                            <td>{{ $employeeData['employee_id_code'] }}</td>
                            <td>{{ $employeeData['role'] }}</td>
                            <td>{{ $employeeData['status'] }}</td>
                            <td>{{ $employeeData['check_in_time'] }}</td>
                            <td>{{ $employeeData['check_out_time'] }}</td>
                            <td>
                                @if(empty($employeeData['tasks']))
                                    No tasks recorded.
                                @else
                                    <ul class="task-list">
                                        @foreach($employeeData['tasks'] as $task)
                                            <li>
                                                {{ $task['description'] }} -
                                                <span class="task-status-{{ $task['status'] }}">
                                                    ({{ ucfirst($task['status']) }})
                                                </span>
                                            </li>
                                        @endforeach
                                    </ul>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <p style="margin-top: 30px;">This is an automated report from your Employee Management System.</p>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Your SaaS Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
