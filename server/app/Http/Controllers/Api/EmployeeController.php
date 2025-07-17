<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Role;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmployeeInviteMail;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    /**
     * Company Admin: Add a new employee and send an invitation.
     * (Existing method, included for context)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function addEmployee(Request $request)
    {
        $company = $request->user();

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized. Only company admins can add employees.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'cnic' => 'required|string|max:20|unique:employees,cnic',
            'email' => 'required|string|email|max:255|unique:employees,email',
            'role_id' => [
                'required',
                'exists:roles,id',
                function ($attribute, $value, $fail) use ($company) {
                    if (!$company->roles()->where('id', $value)->exists()) {
                        $fail('The selected role does not belong to your company.');
                    }
                },
            ],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employeeIdSuffix = Str::upper(Str::random(6));
        $employeeIdCode = $company->company_code . '-' . $employeeIdSuffix;

        while (Employee::where('company_id', $company->id)->where('employee_id_code', $employeeIdCode)->exists()) {
            $employeeIdSuffix = Str::upper(Str::random(6));
            $employeeIdCode = $company->company_code . '-' . $employeeIdSuffix;
        }

        $employee = Employee::create([
            'company_id' => $company->id,
            'role_id' => $request->role_id,
            'employee_id_code' => $employeeIdCode,
            'name' => $request->name,
            'cnic' => $request->cnic,
            'email' => $request->email,
            'status' => 'pending_invite',
            'is_email_verified' => false,
            'enrolment_accepted' => false,
        ]);

        $inviteToken = Str::uuid()->toString();
        $employee->update(['invite_token' => $inviteToken]);

        $inviteLink = config('app.frontend_url') . '/employee/register?employee_id=' . $employee->id . '&token=' . $inviteToken;

        try {
            Mail::to($employee->email)->send(new EmployeeInviteMail(
                $employee->name,
                $company->company_name,
                $employeeIdCode,
                $inviteLink
            ));
        } catch (\Exception $e) {
           
            $employee->delete(); // Rollback if email fails
            return response()->json(['message' => 'Failed to send invitation email. Please try again.'], 500);
        }

        return response()->json([
            'message' => 'Employee added and invitation sent successfully.',
            'employee' => $employee,
            'invite_link' => $inviteLink
        ], 201);
    }

    /**
     * Company Admin: Display a listing of employees for the authenticated company.
     * Includes filtering by status (active, pending_invite, invited, inactive).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $company = $request->user();

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = $company->employees()->with('role'); // Eager load role relationship

        // Filter by status if provided
        if ($request->has('status') && in_array($request->status, ['pending_invite', 'invited', 'active', 'inactive'])) {
            $query->where('status', $request->status);
        }

        $employees = $query->get();

        return response()->json(['employees' => $employees], 200);
    }

    /**
     * Company Admin: Display the specified employee.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Employee  $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, Employee $employee)
    {
        $company = $request->user();

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the employee belongs to the authenticated company
        if ($employee->company_id !== $company->id) {
            return response()->json(['message' => 'Employee not found or does not belong to your company.'], 404);
        }

        $employee->load('role'); // Load the associated role

        return response()->json(['employee' => $employee], 200);
    }

    /**
     * Company Admin: Update the specified employee in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Employee  $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Employee $employee)
    {
        $company = $request->user();

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the employee belongs to the authenticated company
        if ($employee->company_id !== $company->id) {
            return response()->json(['message' => 'Employee not found or does not belong to your company.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'cnic' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('employees', 'cnic')->ignore($employee->id), // Unique CNIC, ignore current employee
            ],
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('employees', 'email')->ignore($employee->id), // Unique email, ignore current employee
            ],
            'role_id' => [
                'sometimes',
                'required',
                'exists:roles,id',
                function ($attribute, $value, $fail) use ($company) {
                    if (!$company->roles()->where('id', $value)->exists()) {
                        $fail('The selected role does not belong to your company.');
                    }
                },
            ],
            'status' => 'sometimes|required|in:pending_invite,invited,active,inactive',
            'profile_image_url' => 'nullable|url|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $employee->update($request->only([
            'name', 'cnic', 'email', 'role_id', 'status', 'profile_image_url'
        ]));

        return response()->json([
            'message' => 'Employee updated successfully.',
            'employee' => $employee->load('role') // Reload with updated role
        ], 200);
    }

    /**
     * Company Admin: Remove the specified employee from storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Employee  $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, Employee $employee)
    {
        $company = $request->user();

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the employee belongs to the authenticated company
        if ($employee->company_id !== $company->id) {
            return response()->json(['message' => 'Employee not found or does not belong to your company.'], 404);
        }

        $employee->delete(); // This will also cascade delete attendance and tasks due to foreign key constraints with onDelete('cascade')

        return response()->json(['message' => 'Employee deleted successfully.'], 200);
    }
}
