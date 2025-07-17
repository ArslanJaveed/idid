<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Employee Invitation</title>
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
            max-width: 600px;
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
        .button {
            display: inline-block;
            background-color: #007bff;
            color: #ffffff !important; /* Important for email clients */
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invitation to Join {{ $companyName }}'s Employee Management System</h1>
        </div>
        <p>Dear {{ $employeeName }},</p>
        <p>You have been invited by <strong>{{ $companyName }}</strong> to join their employee management system.</p>
        <p>Your unique Employee ID assigned by your company is: <strong>{{ $employeeIdCode }}</strong></p>
        <p>Please click the button below to complete your registration and set up your profile:</p>
        <p style="text-align: center;">
            <a href="{{ $inviteLink }}" class="button">Complete Your Registration</a>
        </p>
        <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
        <p><a href="{{ $inviteLink }}">{{ $inviteLink }}</a></p>
        <p>We look forward to having you on board!</p>
        <p>Best regards,</p>
        <p>The {{ $companyName }} Team</p>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Your SaaS Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
