<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Employee;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str; // For OTP generation
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail; // Reusing the OtpMail class
use Illuminate\Validation\Rule; // For unique validation

class EmployeeAuthController extends Controller
{
    /**
     * Verify the invitation token and employee ID.
     * This is the first step when an employee clicks the invite link.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyInvite(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::find($request->employee_id);

        // Check if employee exists, token matches, and status is 'pending_invite'
        if (!$employee || $employee->invite_token !== $request->token || $employee->status !== 'pending_invite') {
            return response()->json(['message' => 'Invalid or expired invitation link.'], 400);
        }

        // Mark status as 'invited' to indicate the link has been accessed
        $employee->update(['status' => 'invited']);

        return response()->json([
            'message' => 'Invitation verified. Please complete your profile.',
            'employee' => $employee // Return employee details for profile setup
        ], 200);
    }

    /**
     * Employee completes their profile and accepts enrollment.
     * This should be called after verifyInvite.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function completeProfileAndAcceptEnrollment(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'name' => 'required|string|max:255', // Employee can update their name
            'profile_image_url' => 'nullable|url|max:2048', // Optional profile image URL
            'employee_id_code' => [ // Employee must provide their company-assigned ID
                'required',
                'string',
                'max:255',
                // Ensure the provided employee_id_code matches the one assigned to this employee_id
                Rule::exists('employees', 'employee_id_code')->where(function ($query) use ($request) {
                    return $query->where('id', $request->employee_id);
                }),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::find($request->employee_id);

        // Ensure the employee is in 'invited' status
        if (!$employee || $employee->status !== 'invited') {
            return response()->json(['message' => 'Invalid employee status for profile completion.'], 403);
        }

        // Ensure the provided employee_id_code matches the one assigned
        if ($employee->employee_id_code !== $request->employee_id_code) {
            return response()->json(['message' => 'The provided employee ID does not match.'], 400);
        }

        // Update employee profile and mark enrollment as accepted
        $employee->update([
            'name' => $request->name,
            'profile_image_url' => $request->profile_image_url,
            'enrolment_accepted' => true,
            'status' => 'active', // Employee is now active
            'invite_token' => null, // Clear the invite token after enrollment is accepted
        ]);

        return response()->json([
            'message' => 'Profile completed and enrollment accepted successfully. Please set your password.',
            'employee' => $employee
        ], 200);
    }

    /**
     * Employee sets their password and triggers email OTP for verification.
     * This should be called after completeProfileAndAcceptEnrollment.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function setPasswordAndVerifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::find($request->employee_id);

        // Ensure employee is active and email is not yet verified
        if (!$employee || $employee->status !== 'active' || $employee->is_email_verified) {
            return response()->json(['message' => 'Invalid employee status or email already verified.'], 403);
        }

        // Generate a 6-digit OTP
        $otp = Str::random(6); // You might want to use a more robust OTP generation method
        // For a numeric OTP: $otp = random_int(100000, 999999);

        // Update employee's password and store OTP
        $employee->update([
            'password' => Hash::make($request->password),
            'otp_code' => $otp, // Temporarily add otp_code and otp_expires_at to Employee model
            'otp_expires_at' => now()->addMinutes(10), // OTP valid for 10 minutes
        ]);

        try {
            // Send OTP email to the employee
            Mail::to($employee->email)->send(new OtpMail($otp));
        } catch (\Exception $e) {
            
            return response()->json(['message' => 'Password set, but failed to send OTP email. Please try again later.'], 500);
        }

        return response()->json([
            'message' => 'Password set successfully. An OTP has been sent to your email for verification.',
            'employee_id' => $employee->id
        ], 200);
    }

    /**
     * Verify the OTP sent to the employee's email.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'otp_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::find($request->employee_id);

        // Check if employee exists, OTP matches, and is not expired
        if (!$employee || $employee->otp_code !== $request->otp_code || now()->isAfter($employee->otp_expires_at)) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 400);
        }

        // Mark email as verified and clear OTP fields
        $employee->update([
            'is_email_verified' => true,
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        return response()->json(['message' => 'Employee email verified successfully. You can now log in.'], 200);
    }

    /**
     * Handle employee login.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee = Employee::where('email', $request->email)->first();

        // Check if employee exists and password is correct
        if (!$employee || !Hash::check($request->password, $employee->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Ensure email is verified and employee is active
        if (!$employee->is_email_verified) {
            return response()->json(['message' => 'Please verify your email first.'], 403);
        }
        if ($employee->status !== 'active') {
            return response()->json(['message' => 'Your account is not active. Please complete your registration or contact your company admin.'], 403);
        }

        // Revoke old tokens and create a new one
        $employee->tokens()->delete(); // Revoke all existing tokens for this employee
        $token = $employee->createToken('employee-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'employee' => $employee,
            'token' => $token,
        ], 200);
    }

    /**
     * Get authenticated employee details.
     * This endpoint will be protected by Sanctum middleware.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function employeeDetails(Request $request)
    {
        return response()->json(['employee' => $request->user()], 200);
    }

    /**
     * Handle employee logout.
     * This endpoint will be protected by Sanctum middleware.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.'], 200);
    }
}
