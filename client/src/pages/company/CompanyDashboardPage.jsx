import React, { useEffect, useState } from 'react';
import useAuth from '../../hooks/useAuth';
import companyService from '../../api/companyService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { Link } from 'react-router-dom';

const CompanyDashboardPage = () => {
    const { currentUser, loadingAuth } = useAuth();
    const [employeesSummary, setEmployeesSummary] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading state set to true
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');

    useEffect(() => {
        console.log("CompanyDashboardPage useEffect triggered.");
        console.log("currentUser:", currentUser);
        console.log("loadingAuth:", loadingAuth);

        const fetchDashboardData = async () => {
            // Only proceed if auth loading is complete and currentUser is available
            if (loadingAuth || !currentUser) {
                console.log("Skipping fetchDashboardData: loadingAuth or currentUser not ready.");
                // If currentUser is null after loadingAuth is false, it means unauthorized
                if (!loadingAuth && !currentUser) {
                    setMessage("You are not authorized to view this page. Please log in.");
                    setMessageType("error");
                    setLoading(false); // Stop loading if unauthorized
                }
                return;
            }

            setLoading(true); // Start loading for data fetch
            setMessage('');
            setMessageType('info');
            console.log("Starting fetchDashboardData for company:", currentUser.company_name);

            try {
                const activeEmployeesResponse = await companyService.getCompanyEmployees('active');
                const pendingInvitesResponse = await companyService.getCompanyEmployees('pending_invite');
                const invitedEmployeesResponse = await companyService.getCompanyEmployees('invited');

                console.log("Active Employees Response:", activeEmployeesResponse.data.employees);
                console.log("Pending Invites Response:", pendingInvitesResponse.data.employees);
                console.log("Invited Employees Response:", invitedEmployeesResponse.data.employees);


                setEmployeesSummary({
                    active: activeEmployeesResponse.data.employees.length,
                    pending: pendingInvitesResponse.data.employees.length,
                    invited: invitedEmployeesResponse.data.employees.length,
                    total: activeEmployeesResponse.data.employees.length + pendingInvitesResponse.data.employees.length + invitedEmployeesResponse.data.employees.length,
                });
                setMessage('Dashboard data loaded successfully.');
                setMessageType('success');
                console.log("Dashboard data fetched and set successfully.");

            } catch (error) {
                setMessage(error.response?.data?.message || 'Failed to load dashboard data. Please check your network and permissions.');
                setMessageType('error');
                console.error('Failed to fetch dashboard data:', error.response?.data || error.message);
            } finally {
                setLoading(false); // Stop loading regardless of success or failure
                console.log("fetchDashboardData finished. Loading set to false.");
            }
        };

        fetchDashboardData();
    }, [currentUser, loadingAuth]); // Dependencies: re-run if currentUser or loadingAuth changes

    // Render logic based on loading and error states
    if (loadingAuth || loading) {
        console.log("Rendering loading state. loadingAuth:", loadingAuth, "loading:", loading);
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading dashboard...</p>
            </div>
        );
    }

    // If currentUser is null after loadingAuth is false, it means authentication failed
    if (!currentUser) {
        console.log("Rendering unauthorized state: currentUser is null.");
        return (
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
                <MessageBox message={message || "Authentication failed or session expired. Please log in again."} type={messageType || "error"} onClose={() => setMessage('')} />
                <p className="text-gray-600 mt-4">Please ensure you are logged in as a company administrator.</p>
                <Link to="/company-login" className="mt-4 text-indigo-600 hover:underline">
                    Go to Company Login
                </Link>
            </div>
        );
    }

    console.log("Rendering dashboard content. employeesSummary:", employeesSummary);
    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Company Dashboard</h1>

            {/* Message box for success/error messages */}
            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Company Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Company Overview</h2>
                    <p className="text-gray-600"><strong>Name:</strong> {currentUser.company_name}</p>
                    <p className="text-gray-600"><strong>Email:</strong> {currentUser.email}</p>
                    <p className="text-gray-600"><strong>Type:</strong> {currentUser.company_type === 'Other' ? currentUser.custom_company_type : currentUser.company_type}</p>
                    <p className="text-gray-600"><strong>Code:</strong> <span className="font-bold text-indigo-600">{currentUser.company_code}</span></p>
                    <Link to="/company-settings" className="text-indigo-600 hover:text-indigo-800 text-sm mt-4 inline-block">
                        Edit Company Settings
                    </Link>
                </div>

                {/* Employee Summary Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Employee Summary</h2>
                    {employeesSummary ? ( // Only render if employeesSummary is not null
                        <>
                            <p className="text-gray-600"><strong>Total Employees:</strong> <span className="font-bold">{employeesSummary.total}</span></p>
                            <p className="text-gray-600"><strong>Active:</strong> <span className="text-green-600 font-semibold">{employeesSummary.active}</span></p>
                            <p className="text-gray-600"><strong>Pending Invites:</strong> <span className="text-orange-600 font-semibold">{employeesSummary.pending}</span></p>
                            <p className="text-gray-600"><strong>Invited (Pending Profile):</strong> <span className="text-blue-600 font-semibold">{employeesSummary.invited}</span></p>
                        </>
                    ) : (
                        <p className="text-gray-500">No employee summary available.</p>
                    )}
                    <Link to="/company-employees" className="text-indigo-600 hover:text-indigo-800 text-sm mt-4 inline-block">
                        Manage Employees
                    </Link>
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link to="/company-employees" className="block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
                            Add New Employee
                        </Link>
                        <Link to="/company-roles" className="block w-full text-center bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition duration-200">
                            Manage Roles
                        </Link>
                        <Link to="/company-settings" className="block w-full text-center bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
                            Update Company Settings
                        </Link>
                    </div>
                </div>
            </div>

            {/* You can add more sections here, e.g., recent attendance summary */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Activity (Coming Soon)</h2>
                <p className="text-gray-500">This section will show a summary of recent employee check-ins, check-outs, and task completions.</p>
            </div>
        </div>
    );
};

export default CompanyDashboardPage;
