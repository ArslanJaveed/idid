import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import companyService from '../../api/companyService';
import roleService from '../../api/roleService';
import attendanceService from '../../api/attendanceService'; // For attendance history
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format, parseISO } from 'date-fns'; // For date formatting

const CompanyEmployeeDetailsPage = () => {
    const { id } = useParams(); // Get employee ID from URL
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [roles, setRoles] = useState([]); // For role dropdown in edit modal
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    // Edit Modal states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: '',
        cnic: '',
        email: '',
        role_id: '',
        profile_image_url: '',
        status: '',
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalErrors, setModalErrors] = useState({});

    // Attendance history filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchEmployeeDetails();
        fetchRoles();
    }, [id]); // Refetch if employee ID changes

    useEffect(() => {
        if (employee) {
            fetchAttendanceHistory();
        }
    }, [employee, startDate, endDate]); // Refetch history if employee or date filters change

    const fetchEmployeeDetails = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('info');
        try {
            const response = await companyService.getEmployeeById(id);
            setEmployee(response.data.employee);
            setEditFormData({
                name: response.data.employee.name,
                cnic: response.data.employee.cnic,
                email: response.data.employee.email,
                role_id: response.data.employee.role_id,
                profile_image_url: response.data.employee.profile_image_url || '',
                status: response.data.employee.status,
            });
            setMessage('Employee details loaded.');
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load employee details.');
            setMessageType('error');
            console.error('Failed to fetch employee details:', error);
            setEmployee(null); // Clear employee if not found
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const response = await roleService.getRoles();
            setRoles(response.data.roles);
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        }
    };

    const fetchAttendanceHistory = async () => {
        try {
            const response = await attendanceService.getEmployeeAttendanceHistoryForAdmin(id, startDate, endDate);
            setAttendanceHistory(response.data.attendance_history);
        } catch (error) {
            console.error('Failed to fetch attendance history:', error);
            setMessage('Failed to load attendance history.');
            setMessageType('error');
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData({ ...editFormData, [name]: value });
        setModalErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    };

    const openEditModal = () => {
        setIsEditModalOpen(true);
        setModalErrors({});
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setModalErrors({});
        // Reset form data to current employee's data if cancelled
        if (employee) {
            setEditFormData({
                name: employee.name,
                cnic: employee.cnic,
                email: employee.email,
                role_id: employee.role_id,
                profile_image_url: employee.profile_image_url || '',
                status: employee.status,
            });
        }
    };

    const handleUpdateEmployee = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await companyService.updateEmployee(id, editFormData);
            setMessage(response.data.message);
            setMessageType('success');
            setEmployee(response.data.employee); // Update local state with new data
            closeEditModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setModalErrors(error.response.data.errors);
                setMessage('Please correct the errors in the form.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to update employee.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteEmployee = async () => {
        if (window.confirm('Are you sure you want to delete this employee? This action is irreversible and will delete all associated data.')) {
            setLoading(true);
            setMessage('');
            setMessageType('info');
            try {
                await companyService.deleteEmployee(id);
                setMessage('Employee deleted successfully.');
                setMessageType('success');
                navigate('/company-employees'); // Redirect to employees list
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
                <p className="ml-2 text-gray-700">Loading employee details...</p>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-6 bg-white rounded-lg shadow-md text-center">
                <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />
                <p className="text-gray-600 mt-4">Employee not found or an error occurred.</p>
                <button onClick={() => navigate('/company-employees')} className="mt-4 text-indigo-600 hover:underline">
                    Back to Employee List
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Employee Details: {employee.name}</h1>

            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 mb-8">
                <div className="flex items-center space-x-6 mb-6">
                    <img
                        src={employee.profile_image_url || `https://placehold.co/100x100/e0e0e0/ffffff?text=${employee.name.charAt(0)}`}
                        alt={employee.name}
                        className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500"
                    />
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{employee.name}</h2>
                        <p className="text-gray-600">{employee.email}</p>
                        <p className="text-gray-600">Employee ID: <span className="font-semibold text-indigo-700">{employee.employee_id_code}</span></p>
                        <p className="text-gray-600">Role: <span className="font-semibold">{employee.role?.role_name || 'N/A'}</span></p>
                        <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(employee.status)} mt-2`}>
                            {employee.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>

                <div className="flex space-x-4 mt-6">
                    <button
                        onClick={openEditModal}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                    >
                        Edit Employee
                    </button>
                    <button
                        onClick={handleDeleteEmployee}
                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                    >
                        Delete Employee
                    </button>
                    <button
                        onClick={() => navigate('/company-employees')}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                    >
                        Back to List
                    </button>
                </div>
            </div>

            {/* Attendance History Section */}
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Attendance History</h2>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2.5"
                        />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2.5"
                        />
                    </div>
                    <button
                        onClick={fetchAttendanceHistory}
                        className="self-end bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                    >
                        Apply Filter
                    </button>
                </div>

                {attendanceHistory.length === 0 ? (
                    <p className="text-gray-500">No attendance records found for the selected period.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceHistory.map((record) => (
                                    <tr key={record.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {format(parseISO(record.date), 'PPP')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.check_in_time ? format(parseISO(record.check_in_time), 'p') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.check_out_time ? format(parseISO(record.check_out_time), 'p') : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                                                {record.status.replace(/_/g, ' ')}
                                            </span>
                                            {record.is_absent && <span className="ml-2 text-red-500 text-xs">(Late)</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {record.tasks.length > 0 ? (
                                                <ul className="list-disc list-inside space-y-1">
                                                    {record.tasks.map(task => (
                                                        <li key={task.id} className={`text-xs ${task.status === 'completed' ? 'text-green-600' : task.status === 'incomplete' ? 'text-orange-600' : 'text-gray-600'}`}>
                                                            {task.description} ({task.status})
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : 'No tasks'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Employee Modal */}
            <Transition appear show={isEditModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeEditModal}>
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
                                        Edit Employee Details
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleUpdateEmployee} className="space-y-4">
                                            <div>
                                                <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                                <input type="text" name="name" id="edit_name" value={editFormData.name} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.name && <p className="text-red-500 text-xs mt-1">{modalErrors.name[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="edit_cnic" className="block text-sm font-medium text-gray-700">CNIC</label>
                                                <input type="text" name="cnic" id="edit_cnic" value={editFormData.cnic} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.cnic && <p className="text-red-500 text-xs mt-1">{modalErrors.cnic[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="edit_email" className="block text-sm font-medium text-gray-700">Email</label>
                                                <input type="email" name="email" id="edit_email" value={editFormData.email} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required />
                                                {modalErrors.email && <p className="text-red-500 text-xs mt-1">{modalErrors.email[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="edit_role_id" className="block text-sm font-medium text-gray-700">Role</label>
                                                <select name="role_id" id="edit_role_id" value={editFormData.role_id} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required>
                                                    <option value="">Select a Role</option>
                                                    {roles.map(role => (
                                                        <option key={role.id} value={role.id}>{role.role_name}</option>
                                                    ))}
                                                </select>
                                                {modalErrors.role_id && <p className="text-red-500 text-xs mt-1">{modalErrors.role_id[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700">Status</label>
                                                <select name="status" id="edit_status" value={editFormData.status} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" required>
                                                    <option value="active">Active</option>
                                                    <option value="pending_invite">Pending Invite</option>
                                                    <option value="invited">Invited (Profile Pending)</option>
                                                    <option value="inactive">Inactive</option>
                                                </select>
                                                {modalErrors.status && <p className="text-red-500 text-xs mt-1">{modalErrors.status[0]}</p>}
                                            </div>
                                            <div>
                                                <label htmlFor="edit_profile_image_url" className="block text-sm font-medium text-gray-700">Profile Image URL (Optional)</label>
                                                <input type="url" name="profile_image_url" id="edit_profile_image_url" value={editFormData.profile_image_url} onChange={handleEditFormChange}
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5" />
                                                {modalErrors.profile_image_url && <p className="text-red-500 text-xs mt-1">{modalErrors.profile_image_url[0]}</p>}
                                            </div>

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                                                    onClick={closeEditModal}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                                                >
                                                    {modalLoading ? <LoadingSpinner /> : 'Update Employee'}
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

export default CompanyEmployeeDetailsPage;
