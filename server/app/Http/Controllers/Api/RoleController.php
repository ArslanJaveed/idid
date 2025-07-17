<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Company;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class RoleController extends Controller
{
    /**
     * Display a listing of roles for the authenticated company.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized. Only company admins can view roles.'], 403);
        }

        $roles = $company->roles()->get();

        return response()->json(['roles' => $roles], 200);
    }

    /**
     * Store a newly created role in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'role_name' => [
                'required',
                'string',
                'max:255',
                // Ensure role name is unique for the specific company
                Rule::unique('roles')->where(function ($query) use ($company) {
                    return $query->where('company_id', $company->id);
                }),
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = $company->roles()->create([
            'role_name' => $request->role_name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Role created successfully.',
            'role' => $role
        ], 201);
    }

    /**
     * Display the specified role.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Role  $role
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, Role $role)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the role belongs to the authenticated company
        if ($role->company_id !== $company->id) {
            return response()->json(['message' => 'Role not found or does not belong to your company.'], 404);
        }

        return response()->json(['role' => $role], 200);
    }

    /**
     * Update the specified role in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Role  $role
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Role $role)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the role belongs to the authenticated company
        if ($role->company_id !== $company->id) {
            return response()->json(['message' => 'Role not found or does not belong to your company.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'role_name' => [
                'required',
                'string',
                'max:255',
                // Ensure role name is unique for the specific company, excluding the current role
                Rule::unique('roles')->where(function ($query) use ($company) {
                    return $query->where('company_id', $company->id);
                })->ignore($role->id),
            ],
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role->update($request->only(['role_name', 'description']));

        return response()->json([
            'message' => 'Role updated successfully.',
            'role' => $role
        ], 200);
    }

    /**
     * Remove the specified role from storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Role  $role
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, Role $role)
    {
        $company = $request->user(); // Authenticated company admin

        if (!$company instanceof Company) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Ensure the role belongs to the authenticated company
        if ($role->company_id !== $company->id) {
            return response()->json(['message' => 'Role not found or does not belong to your company.'], 404);
        }

        // Prevent deleting roles if employees are assigned to them (optional, but good practice)
        if ($role->employees()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role. Employees are currently assigned to it.'], 409);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully.'], 200);
    }
}
