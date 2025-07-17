<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\OtpMail;
use Illuminate\Validation\Rule;

class CompanyAuthController extends Controller
{
    /**
     * Handle company registration.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        // Validate incoming request data
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email|max:255|unique:companies,email',
            'company_name' => 'required|string|max:255',
            'company_type' => 'required|string|max:255',
            'custom_company_type' => 'nullable|string|max:255|required_if:company_type,Other',
            'country' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'address' => 'required|string',
            'terms_accepted' => 'required|boolean|accepted', 
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Generate a 6-digit OTP
        $otp = Str::random(6); // You might want to use a more robust OTP generation method
        // For a numeric OTP: $otp = random_int(100000, 999999);

        // Create the company record in a pending state
        $company = Company::create([
            'email' => $request->email,
            'password' => '', // Password will be set after OTP verification
            'company_name' => $request->company_name,
            'company_type' => $request->company_type,
            'custom_company_type' => $request->company_type === 'Other' ? $request->custom_company_type : null,
            'country' => $request->country,
            'city' => $request->city,
            'address' => $request->address,
            'terms_accepted' => $request->terms_accepted,
            'otp_code' => $otp,
            'otp_expires_at' => now()->addMinutes(10), // OTP valid for 10 minutes
            'is_email_verified' => false,
            'company_code' => '', // Company code will be set after OTP verification
        ]);

        try {
            // Send OTP email to the company
            Mail::to($company->email)->send(new OtpMail($otp));
        } catch (\Exception $e) {
            // Log the error and return a server error response
            // \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return response()->json(['message' => 'Company registered, but failed to send OTP email. Please try again later.'], 500);
        }

        return response()->json([
            'message' => 'Company registered successfully. An OTP has been sent to your email for verification.',
            'company_id' => $company->id
        ], 201);
    }

    /**
     * Verify the OTP sent to the company's email.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyOtp(Request $request)
    {
        // Validate incoming request data
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'otp_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::find($request->company_id);

        // Check if company exists and OTP matches and is not expired
        if (!$company || $company->otp_code !== $request->otp_code || now()->isAfter($company->otp_expires_at)) {
            return response()->json(['message' => 'Invalid or expired OTP.'], 400);
        }

        // Mark email as verified and clear OTP fields
        $company->update([
            'is_email_verified' => true,
            'otp_code' => null,
            'otp_expires_at' => null,
        ]);

        return response()->json(['message' => 'Email verified successfully. You can now set your password and company code.'], 200);
    }

    /**
     * Set the company password and unique 4-digit company code.
     * This should only be called after email verification.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function setPasswordAndCompanyCode(Request $request)
    {
        // Validate incoming request data
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'password' => 'required|string|min:8|confirmed',
            'company_code' => [
                'required',
                'string',
                'size:4',
                // Ensure company_code is unique in the companies table
                Rule::unique('companies', 'company_code')->ignore($request->company_id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $company = Company::find($request->company_id);

        // Ensure the company's email is verified before allowing password/code setup
        if (!$company || !$company->is_email_verified) {
            return response()->json(['message' => 'Email not verified. Please verify your email first.'], 403);
        }

        // Update company's password and company code
        $company->update([
            'password' => Hash::make($request->password),
            'company_code' => strtoupper($request->company_code), // Store company code in uppercase
        ]);

        return response()->json(['message' => 'Password and company code set successfully.'], 200);
    }

    /**
     * Handle company admin login.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        // Validate login credentials
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Attempt to find the company by email
        $company = Company::where('email', $request->email)->first();

        // Check if company exists and password is correct
        if (!$company || !Hash::check($request->password, $company->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        // Ensure email is verified and company code is set
        if (!$company->is_email_verified) {
            return response()->json(['message' => 'Please verify your email first.'], 403);
        }
        if (empty($company->company_code)) {
            return response()->json(['message' => 'Company setup not complete. Please set your company code and password.'], 403);
        }

        // Revoke old tokens and create a new one
        $company->tokens()->delete(); // Revoke all existing tokens for this company
        $token = $company->createToken('company-admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'company' => $company,
            'token' => $token,
        ], 200);
    }

    /**
     * Get authenticated company details.
     * This endpoint will be protected by Sanctum middleware.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function companyDetails(Request $request)
    {
        return response()->json(['company' => $request->user()], 200);
    }

    /**
     * Handle company admin logout.
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

    /**
     * Company Admin: Update company settings (check-in/out times, grace period).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCompanySettings(Request $request)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'default_check_in_time' => 'nullable|date_format:H:i:s', // HH:MM:SS format
            'default_check_out_time' => 'nullable|date_format:H:i:s',
            'late_check_in_grace_period_minutes' => 'nullable|integer|min:0',
            // You can add more fields here if the company admin can update other company details
            'company_name' => 'sometimes|string|max:255',
            'company_type' => 'sometimes|string|max:255',
            'custom_company_type' => 'nullable|string|max:255|required_if:company_type,Other',
            'country' => 'sometimes|string|max:255',
            'city' => 'sometimes|string|max:255',
            'address' => 'sometimes|string',
            'company_image_url' => 'nullable|url|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $updateData = $request->only([
            'default_check_in_time',
            'default_check_out_time',
            'late_check_in_grace_period_minutes',
            'company_name',
            'company_type',
            'country',
            'city',
            'address',
            'company_image_url',
        ]);

        // Handle custom_company_type conditionally
        if ($request->has('company_type') && $request->company_type !== 'Other') {
            $updateData['custom_company_type'] = null;
        } elseif ($request->has('company_type') && $request->company_type === 'Other' && $request->has('custom_company_type')) {
            $updateData['custom_company_type'] = $request->custom_company_type;
        }

        $company->update($updateData);

        return response()->json([
            'message' => 'Company settings updated successfully.',
            'company' => $company
        ], 200);
    }
}
