import axiosInstance from './axiosInstance';

const employeeService = {
    // Employee's own daily workflow
    checkIn: (tasks) => axiosInstance.post('/employee/check-in', { tasks }),
    checkOut: (taskStatuses) => axiosInstance.post('/employee/check-out', { task_statuses: taskStatuses }),
    getTodayStatus: () => axiosInstance.get('/employee/today-status'),
    getEmployeeOwnAttendanceHistory: (startDate = null, endDate = null) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return axiosInstance.get('/employee/attendance-history', { params });
    },
};

export default employeeService;
