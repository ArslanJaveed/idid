import React, { useState, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import employeeService from '../../api/employeeService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import MessageBox from '../../components/common/MessageBox';
import { format, parseISO } from 'date-fns';

const EmployeeAttendanceHistoryPage = () => {
    const { currentUser, loadingAuth } = useAuth();
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('info');
    const [errors, setErrors] = useState({});

    // Filter states
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        if (!loadingAuth && currentUser) {
            fetchAttendanceHistory();
        }
    }, [currentUser, loadingAuth, startDate, endDate]); // Refetch when filters or user changes

    const fetchAttendanceHistory = async () => {
        setLoading(true);
        setMessage('');
        setMessageType('info');
        try {
            const response = await employeeService.getEmployeeOwnAttendanceHistory(startDate, endDate);
            setAttendanceHistory(response.data.attendance_history);
            setMessage('Attendance history loaded successfully.');
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Failed to load attendance history.');
            setMessageType('error');
            console.error('Failed to fetch attendance history:', error);
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
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loadingAuth || loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <LoadingSpinner />
                <p className="ml-2 text-gray-700">Loading attendance history...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Your Attendance History</h1>

            <MessageBox message={message} type={messageType} onClose={() => setMessage('')} />

            <div className="bg-white rounded-lg shadow-md p-8 border border-gray-200 mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Filter History</h2>
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
        </div>
    );
};

export default EmployeeAttendanceHistoryPage;
