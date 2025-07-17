import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import employeeService from '../../api/employeeService';
import taskService from '../../api/taskService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { format, parseISO } from 'date-fns';

const EmployeeDashboardPage = () => {
    const { currentUser, loadingAuth } = useAuth();
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [todayTasks, setTodayTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    // State for Add Task Modal
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [modalErrors, setModalErrors] = useState({});

    // State for Check-in/Check-out with tasks
    const [initialTasks, setInitialTasks] = useState([{ description: '' }]);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [checkOutTaskStatuses, setCheckOutTaskStatuses] = useState({});

    useEffect(() => {
        fetchTodayStatus();
    }, [currentUser, loadingAuth]);

    const fetchTodayStatus = async () => {
        if (loadingAuth || !currentUser) return;

        setLoading(true);
        setMessage('');
        setMessageType('info');

        try {
            const response = await employeeService.getTodayStatus();
            setTodayAttendance(response.data.today_attendance);
            if (response.data.today_attendance && response.data.today_attendance.tasks) {
                setTodayTasks(response.data.today_attendance.tasks);
                // Initialize checkOutTaskStatuses if tasks exist
                const initialStatuses = {};
                response.data.today_attendance.tasks.forEach(task => {
                    initialStatuses[task.id] = task.status === 'completed';
                });
                setCheckOutTaskStatuses(initialStatuses);
            } else {
                setTodayTasks([]);
                setCheckOutTaskStatuses({});
            }
            setMessage(response.data.message);
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load today\'s status.');
            setMessageType('error');
            console.error('Failed to fetch today status:', error);
        } finally {
            setLoading(false);
        }
    };

    // --- Check-in/Check-out Handlers ---
    const openCheckInModal = () => {
        setInitialTasks([{ description: '' }]); // Reset initial tasks
        setErrors({});
        setMessage('');
        setIsCheckInModalOpen(true);
    };

    const closeCheckInModal = () => {
        setIsCheckInModalOpen(false);
        setInitialTasks([{ description: '' }]);
        setErrors({});
        setMessage('');
    };

    const handleInitialTaskChange = (index, e) => {
        const newTasks = [...initialTasks];
        newTasks[index].description = e.target.value;
        setInitialTasks(newTasks);
    };

    const addInitialTaskField = () => {
        setInitialTasks([...initialTasks, { description: '' }]);
    };

    const removeInitialTaskField = (index) => {
        const newTasks = initialTasks.filter((_, i) => i !== index);
        setInitialTasks(newTasks);
    };

    const handleCheckIn = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        const tasksToSend = initialTasks.filter(task => task.description.trim() !== '');

        try {
            const response = await employeeService.checkIn(tasksToSend);
            setMessage(response.data.message);
            setMessageType('success');
            setTodayAttendance(response.data.attendance);
            setTodayTasks(response.data.attendance.tasks || []);
            closeCheckInModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please correct the errors in the task list.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to check in.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    const openCheckOutModal = () => {
        // Initialize checkOutTaskStatuses based on current tasks
        const initialStatuses = {};
        todayTasks.forEach(task => {
            initialStatuses[task.id] = task.status === 'completed';
        });
        setCheckOutTaskStatuses(initialStatuses);
        setErrors({});
        setMessage('');
        setIsCheckOutModalOpen(true);
    };

    const closeCheckOutModal = () => {
        setIsCheckOutModalOpen(false);
        setErrors({});
        setMessage('');
    };

    const handleCheckOutTaskStatusChange = (taskId, isChecked) => {
        setCheckOutTaskStatuses(prev => ({ ...prev, [taskId]: isChecked }));
    };

    const handleCheckOut = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await employeeService.checkOut(checkOutTaskStatuses);
            setMessage(response.data.message);
            setMessageType('success');
            setTodayAttendance(response.data.attendance);
            setTodayTasks(response.data.attendance.tasks || []);
            closeCheckOutModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setErrors(error.response.data.errors);
                setMessage('Please ensure all task statuses are selected.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to check out.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    // --- Add More Task Handlers ---
    const openAddTaskModal = () => {
        setNewTaskDescription('');
        setModalErrors({});
        setIsAddTaskModalOpen(true);
    };

    const closeAddTaskModal = () => {
        setIsAddTaskModalOpen(false);
        setNewTaskDescription('');
        setModalErrors({});
        setMessage('');
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        setModalLoading(true);
        setModalErrors({});
        setMessage('');
        setMessageType('info');

        try {
            const response = await taskService.addTask(newTaskDescription);
            setMessage(response.data.message);
            setMessageType('success');
            // Optimistically update tasks or refetch
            setTodayTasks(prevTasks => [...prevTasks, response.data.task]);
            closeAddTaskModal();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                setModalErrors(error.response.data.errors);
                setMessage('Please enter a task description.');
                setMessageType('error');
            } else {
                setMessage(error.response?.data?.message || 'Failed to add task.');
                setMessageType('error');
            }
        } finally {
            setModalLoading(false);
        }
    };

    // --- Task Status Update Handler (for individual tasks on dashboard) ---
    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        setLoading(true); // Small loading for task update
        setMessage('');
        setMessageType('info');
        try {
            const response = await taskService.updateTaskStatus(taskId, newStatus);
            setMessage(response.data.message);
            setMessageType('success');
            setTodayTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId ? { ...task, status: response.data.task.status } : task
                )
            );
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to update task status.');
            setMessageType('error');
            console.error('Failed to update task status:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'checked_in': return 'bg-blue-100 text-blue-800';
            case 'checked_out': return 'bg-green-100 text-green-800';
            case 'absent': return 'bg-red-100 text-red-800';
            case 'present': return 'bg-green-100 text-green-800'; // For historical 'present' status
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'incomplete': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loadingAuth || loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Employee Dashboard</h1>

            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Employee Info Card */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Your Profile</h2>
                    <div className="flex items-center space-x-4">
                        <img
                            src={currentUser.profile_image_url || `https://placehold.co/60x60/e0e0e0/ffffff?text=${currentUser.name.charAt(0)}`}
                            alt={currentUser.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
                        />
                        <div>
                            <p className="text-gray-600 font-semibold">{currentUser.name}</p>
                            <p className="text-gray-600 text-sm">{currentUser.email}</p>
                            <p className="text-gray-600 text-sm">ID: {currentUser.employee_id_code}</p>
                            <p className="text-gray-600 text-sm">Role: {currentUser.role?.role_name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Today's Attendance Status */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Today's Attendance</h2>
                    {todayAttendance ? (
                        <>
                            <p className="text-gray-600">Status: <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getStatusColor(todayAttendance.status)}`}>
                                {todayAttendance.status.replace(/_/g, ' ')}
                            </span> {todayAttendance.is_absent && <span className="text-red-500 text-xs">(Late)</span>}</p>
                            <p className="text-gray-600">Check-in: {todayAttendance.check_in_time ? format(parseISO(todayAttendance.check_in_time), 'p') : 'N/A'}</p>
                            <p className="text-gray-600">Check-out: {todayAttendance.check_out_time ? format(parseISO(todayAttendance.check_out_time), 'p') : 'N/A'}</p>

                            <div className="mt-4 flex space-x-3">
                                {todayAttendance.status === 'checked_in' && (
                                    <button
                                        onClick={openCheckOutModal}
                                        className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                                    >
                                        Check Out
                                    </button>
                                )}
                                {todayAttendance.status !== 'checked_in' && (
                                    <button
                                        onClick={openCheckInModal}
                                        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                                    >
                                        Check In
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/employee-attendance-history')}
                                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                                >
                                    View History
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600">You are not checked in for today.</p>
                            <button
                                onClick={openCheckInModal}
                                className="mt-4 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-200"
                            >
                                Check In
                            </button>
                        </>
                    )}
                </div>

                {/* Quick Actions / Summary */}
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
                    <div className="space-y-3">
                        {todayAttendance && todayAttendance.status === 'checked_in' && (
                            <button
                                onClick={openAddTaskModal}
                                className="block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                            >
                                Add More Task for Today
                            </button>
                        )}
                        <Link to="/employee-attendance-history" className="block w-full text-center bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200">
                            View Full Attendance History
                        </Link>
                        {/* Option to skip to dashboard if not checked in (as per user request) */}
                        {!todayAttendance && (
                            <button
                                onClick={() => { /* This button would typically just display the dashboard without checking in */ alert('You are viewing the dashboard without checking in.'); }}
                                className="block w-full text-center bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                            >
                                Skip & Go to Dashboard
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Today's Tasks Section */}
            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Today's Tasks</h2>
                {todayTasks.length === 0 ? (
                    <p className="text-gray-500">No tasks recorded for today.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    {todayAttendance?.status === 'checked_in' && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {todayTasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {task.description}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                                                {task.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        {todayAttendance?.status === 'checked_in' && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {task.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                                                        className="text-green-600 hover:text-green-900 mr-3"
                                                    >
                                                        Mark Complete
                                                    </button>
                                                )}
                                                {task.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateTaskStatus(task.id, 'incomplete')}
                                                        className="text-orange-600 hover:text-orange-900"
                                                    >
                                                        Mark Incomplete
                                                    </button>
                                                )}
                                                {task.status !== 'pending' && (
                                                     <span className="text-gray-500 text-xs">Updated</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Check-in Modal */}
            <Transition appear show={isCheckInModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeCheckInModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Check In for Today
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleCheckIn} className="space-y-4">
                                            <p className="text-gray-600 text-sm">Add tasks you plan to work on today (optional).</p>
                                            {initialTasks.map((task, index) => (
                                                <div key={index} className="flex items-center space-x-2">
                                                    <input
                                                        type="text"
                                                        value={task.description}
                                                        onChange={(e) => handleInitialTaskChange(index, e)}
                                                        placeholder={`Task ${index + 1} description`}
                                                        className="flex-1 rounded-md border-gray-300 shadow-sm sm:text-sm p-2.5"
                                                    />
                                                    {initialTasks.length > 1 && (
                                                        <button type="button" onClick={() => removeInitialTaskField(index)}
                                                            className="text-red-500 hover:text-red-700 text-sm font-medium">
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={addInitialTaskField}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                                + Add another task
                                            </button>
                                            {errors.tasks && <p className="text-red-500 text-xs mt-1">{errors.tasks[0]}</p>}
                                            {errors['tasks.0.description'] && <p className="text-red-500 text-xs mt-1">Task description is required.</p>}

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button type="button" onClick={closeCheckInModal}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none">
                                                    {modalLoading ? <LoadingSpinner /> : 'Check In'}
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

            {/* Check-out Modal */}
            <Transition appear show={isCheckOutModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeCheckOutModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Check Out for Today
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleCheckOut} className="space-y-4">
                                            <p className="text-gray-600 text-sm">Mark your tasks as complete or incomplete before checking out.</p>
                                            {todayTasks.length === 0 ? (
                                                <p className="text-gray-500">No tasks to mark.</p>
                                            ) : (
                                                todayTasks.map(task => (
                                                    <div key={task.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={`task-${task.id}`}
                                                            checked={checkOutTaskStatuses[task.id] || false}
                                                            onChange={(e) => handleCheckOutTaskStatusChange(task.id, e.target.checked)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <label htmlFor={`task-${task.id}`} className="text-sm text-gray-700">
                                                            {task.description}
                                                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(task.status)}`}>
                                                                {task.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </label>
                                                    </div>
                                                ))
                                            )}
                                            {errors.task_statuses && <p className="text-red-500 text-xs mt-1">{errors.task_statuses[0]}</p>}

                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button type="button" onClick={closeCheckOutModal}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none">
                                                    {modalLoading ? <LoadingSpinner /> : 'Check Out'}
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

            {/* Add More Task Modal */}
            <Transition appear show={isAddTaskModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10 font-inter" onClose={closeAddTaskModal}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        Add New Task for Today
                                    </Dialog.Title>
                                    <div className="mt-4">
                                        <form onSubmit={handleAddTask} className="space-y-4">
                                            <div>
                                                <label htmlFor="newTaskDescription" className="block text-sm font-medium text-gray-700">Task Description</label>
                                                <textarea
                                                    id="newTaskDescription"
                                                    value={newTaskDescription}
                                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                                    rows="3"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5"
                                                    required
                                                ></textarea>
                                                {modalErrors.description && <p className="text-red-500 text-xs mt-1">{modalErrors.description[0]}</p>}
                                            </div>
                                            <div className="mt-4 flex justify-end space-x-3">
                                                <button type="button" onClick={closeAddTaskModal}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none">
                                                    Cancel
                                                </button>
                                                <button type="submit" disabled={modalLoading}
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none">
                                                    {modalLoading ? <LoadingSpinner /> : 'Add Task'}
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

export default EmployeeDashboardPage;
