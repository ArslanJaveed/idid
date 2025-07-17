import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom'; // Added Link import
import useAuth from '../hooks/useAuth';
import MainLayout from '../components/layout/MainLayout';

// Import your pages
import CompanyRegistrationPage from '../pages/auth/CompanyRegistrationPage';
import CompanyLoginPage from '../pages/auth/CompanyLoginPage';
import EmployeeInviteRegistrationPage from '../pages/auth/EmployeeInviteRegistrationPage';
import EmployeeLoginPage from '../pages/auth/EmployeeLoginPage';

// Company Admin Pages
import CompanyDashboardPage from '../pages/company/CompanyDashboardPage';
import CompanySettingsPage from '../pages/company/CompanySettingsPage';
import CompanyRolesPage from '../pages/company/CompanyRolesPage';
import CompanyEmployeesPage from '../pages/company/CompanyEmployeesPage';
import CompanyEmployeeDetailsPage from '../pages/company/CompanyEmployeeDetailsPage';

// Employee Pages
import EmployeeDashboardPage from '../pages/employee/EmployeeDashboardPage';
// import EmployeeDailyTasksPage from '../pages/employee/EmployeeDailyTasksPage'; // Removed: Functionality integrated into EmployeeDashboardPage
import EmployeeAttendanceHistoryPage from '../pages/employee/EmployeeAttendanceHistoryPage';


const AppRoutes = () => {
    const { isAuthenticated, userType, loadingAuth } = useAuth();

    if (loadingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-xl text-gray-700">Loading application...</p>
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/register-company" replace />} />
            <Route path="/register-company" element={<CompanyRegistrationPage />} />
            <Route path="/company-login" element={<CompanyLoginPage />} />
            <Route path="/employee-login" element={<EmployeeLoginPage />} />
            <Route path="/employee/register" element={<EmployeeInviteRegistrationPage />} />

            {/* Protected Company Routes */}
            {isAuthenticated && userType === 'company' ? (
                <Route element={<MainLayout />}>
                    <Route path="/company-dashboard" element={<CompanyDashboardPage />} />
                    <Route path="/company-settings" element={<CompanySettingsPage />} />
                    <Route path="/company-roles" element={<CompanyRolesPage />} />
                    <Route path="/company-employees" element={<CompanyEmployeesPage />} />
                    <Route path="/company-employees/:id" element={<CompanyEmployeeDetailsPage />} />
                </Route>
            ) : (
                // Redirect unauthenticated company users to company login
                <Route path="/company-dashboard" element={<Navigate to="/company-login" replace />} />
            )}

            {/* Protected Employee Routes */}
            {isAuthenticated && userType === 'employee' ? (
                <Route element={<MainLayout />}>
                    <Route path="/employee-dashboard" element={<EmployeeDashboardPage />} />
                    {/* <Route path="/employee-daily-tasks" element={<EmployeeDailyTasksPage />} /> */} {/* Removed this route */}
                    <Route path="/employee-attendance-history" element={<EmployeeAttendanceHistoryPage />} />
                </Route>
            ) : (
                // Redirect unauthenticated employee users to employee login
                <Route path="/employee-dashboard" element={<Navigate to="/employee-login" replace />} />
            )}

            {/* Fallback for any unmatched routes */}
            <Route path="*" element={
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-700 font-inter">
                    <h1 className="text-6xl font-extrabold text-indigo-600">404</h1>
                    <p className="text-2xl font-semibold mt-4">Page Not Found</p>
                    <p className="mt-2">The page you're looking for doesn't exist.</p>
                    <Link to="/" className="mt-6 px-6 py-3 bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 transition duration-200">
                        Go to Home
                    </Link>
                </div>
            } />
        </Routes>
    );
};

export default AppRoutes;
