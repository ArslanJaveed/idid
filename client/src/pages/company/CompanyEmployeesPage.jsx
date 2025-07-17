import React, { useState, useEffect } from 'react';
import companyService from '../../api/companyService';
import roleService from '../../api/roleService'; // To fetch roles for the add/edit form
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

const CompanyEmployeesPage = () => {
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]); // For dropdown in add/edit form
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    // Filter state
    const [filterStatus, setFilterStatus] = useState(''); // 'active', 'pending_invite', 'invited', 'inactive'

    // Add/Edit Employee Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null); // Employee being edited, null for new employee
    const [employeeFormData, setEmployeeFormData] = useState({
        name: '',
        cnic: '',
        email: '',
        role_id: '',
        profile_image_url: '',
        status: 'pending_invite', // Default for new employee
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalErrors, setModalErrors] = useState({});

    useEffect(() => {
        fetchEmployees();
        fetchRoles();
    }, [filterStatus]); // Refetch when filter status changes

    const fetchEmployees = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('info');
        try {
            const response = await companyService.getCompanyEmployees(filterStatus);
            setEmployees(response.data.employees);
            setMessage('Employees loaded successfully.');
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load employees.');
            setMessageType('error');
            console.error('Failed to fetch employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await roleService.getRoles();
            setRoles(response.data.roles);
        } catch (error) {
            console.error('Failed to fetch roles for dropdown:', error);
            setMessage('Failed to load roles for employee form.');
            setMessageType('error');
        }
    };

    const handleEmployeeFormChange = (e) => {
        const { name, value } = e.target;
        setEmployeeFormData({ ...employeeFormData, [name]: value });
        setModalErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const openCreateModal = () => {
        setCurrentEmployee(null);
        setEmployeeFormData({
            name: '',
            cnic: '',
            email: '',
            role_id: roles.length > 0 ? roles[0].id : '', // Pre-select first role if available
            profile_image_url: '',
            status: 'pending_invite',
        });
        setModalErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (employee) => {
        setCurrentEmployee(employee);
        setEmployeeFormData({
            name: employee.name,
            cnic: employee.cnic,
            email: employee.email,
            role_id: employee.role_id,
            profile_image_url: employee.profile_image_url || '',
            status: employee.status,
        });
        setModalErrors({});
        setIsModalOpen(true);
    };

    const closeEmployeeModal = () => {
        setIsModalOpen(false);
        setCurrentEmployee(null);
        setEmployeeFormData({
            name: '', cnic: '', email: '', role_id: '', profile_image_url: '', status: 'pending_invite'
        });
        setModalErrors({});
        setMessage(''); // Clear main message as well
    };

    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalErrors({});
        setMessage(''); // Clear main message

        try {
            let response;
            if (currentEmployee) {
                // Update existing employee
                response = await companyService.updateEmployee(currentEmployee.id, employeeFormData);
            } else {
                // Create new employee
                response = await companyService.addEmployee(employeeFormData);
            }
            setMessage(response.data.message);
            setMessageType('success');
            closeEmployeeModal();
            fetchEmployees(); // Refresh employees list
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setModalErrors(error.response.data.errors);
                setMessage('Please correct the errors in the form.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to save employee.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (window.confirm('Are you sure you want to delete this employee? This will also delete their attendance and task records.')) {
            setLoading(true);
            setMessage('');
            setMessageType('info');
            try {
                const response = await companyService.deleteEmployee(employeeId);
                setMessage(response.data.message);
                setMessageType('success');
                fetchEmployees(); // Refresh employees list
            } catch (error) {
                setMessage(error.response?.data?.message || 'Failed to delete employee.');
                setMessageType('error');
            } finally {
                setLoading(false);
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'pending_invite': return 'bg-yellow-100 text-yellow-800';
            case 'invited': return 'bg-blue-100 text-blue-800';
            case 'inactive': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading employees...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Company Employees</h1>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
                <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
                <div className="flex space-x-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending_invite">Pending Invite</option>
                        <option value="invited">Invited (Profile Pending)</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                    >
                        Add New Employee
                    </button>
                </div>
            </div>

            {employees.length === 0 ? (
                <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
                    <p>No employees found for the selected filter. Click "Add New Employee" to add one.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee ID
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {employees.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {employee.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.employee_id_code}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {employee.role?.role_name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                                            {employee.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <Link to={`/company-employees/${employee.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                                            View
                                        </Link>
                                        <button
                                            onClick={() => openEditModal(employee)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEmployee(employee.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add/Edit Employee Modal */}
            <Transition appear show={isModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeEmployeeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        {currentEmployee ? 'Edit Employee' : 'Add New Employee'}
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleSaveEmployee} className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                                <input type="text" name="name" id="name" value={employeeFormData.name} onChange={handleEmployeeFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.name && <p className="text-red-500 text-xs mt-1">{modalErrors.name[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="cnic" className="block text-sm font-medium text-gray-700">CNIC</label>
                                                <input type="text" name="cnic" id="cnic" value={employeeFormData.cnic} onChange={handleEmployeeFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.cnic && <p className="text-red-500 text-xs mt-1">{modalErrors.cnic[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                                <input type="email" name="email" id="email" value={employeeFormData.email} onChange={handleEmployeeFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.email && <p className="text-red-500 text-xs mt-1">{modalErrors.email[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="role_id" className="block text-sm font-medium text-gray-700">Role</label>
                                                <select name="role_id" id="role_id" value={employeeFormData.role_id} onChange={handleEmployeeFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required>
                                                    <option value="">Select a Role</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.role_name}</option>
                                                    ))}
                                                </select>
                                                {modalErrors.role_id && <p className="text-red-500 text-xs mt-1">{modalErrors.role_id[0]}</p>}
                                            </div>
                                            {currentEmployee && ( // Only show status and image URL for existing employees
                                                <>
                                                    <div>
                                                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                                                        <select name="status" id="status" value={employeeFormData.status} onChange={handleEmployeeFormChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required>
                                                            <option value="active">Active</option>
                                                            <option value="pending_invite">Pending Invite</option>
                                                            <option value="invited">Invited (Profile Pending)</option>
                                                            <option value="inactive">Inactive</option>
                                                        </select>
                                                        {modalErrors.status && <p className="text-red-500 text-xs mt-1">{modalErrors.status[0]}</p>}
                                                    </div>
                                                    <div>
                                                        <label htmlFor="profile_image_url" className="block text-sm font-medium text-gray-700">Profile Image URL (Optional)</label>
                                                        <input type="url" name="profile_image_url" id="profile_image_url" value={employeeFormData.profile_image_url} onChange={handleEmployeeFormChange}
                                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                                                        {modalErrors.profile_image_url && <p className="text-red-500 text-xs mt-1">{modalErrors.profile_image_url[0]}</p>}
                                                    </div>
                                                </>
                                            )}

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={closeEmployeeModal}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                >
                                                    {modalLoading ? <LoadingSpinner /> : (currentEmployee ? 'Update Employee' : 'Add Employee')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    );
};

export default CompanyEmployeesPage;
