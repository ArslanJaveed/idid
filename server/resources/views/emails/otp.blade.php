<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
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
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            text-align: center;
            margin: 30px 0;
            padding: 15px;
            border: 2px dashed #007bff;
            border-radius: 5px;
            letter-spacing: 5px;
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
            <h1>OTP Verification</h1>
        </div>
        <p>Dear Company,</p>
        <p>Thank you for registering with our SaaS platform. To complete your email verification, please use the One-Time Password (OTP) below:</p>
        <div class="otp-code">{{ $otp }}</div>
        <p>This OTP is valid for 10 minutes. Please do not share this code with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,</p>
        <p>Your SaaS Team</p>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Your SaaS Name. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
