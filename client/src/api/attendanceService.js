import axiosInstance from './axiosInstance';

const attendanceService = {
    // Employee's own attendance (re-exported from employeeService for clarity if preferred)
    checkIn: (tasks) => axiosInstance.post('/employee/check-in', { tasks }),
    checkOut: (taskStatuses) => axiosInstance.post('/employee/check-out', { task_statuses: taskStatuses }),
    getTodayStatus: () => axiosInstance.get('/employee/today-status'),
    getEmployeeOwnAttendanceHistory: (startDate = null, endDate = null) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return axiosInstance.get('/employee/attendance-history', { params });
    },
    // Admin view of employee attendance (re-exported from companyService for clarity if preferred)
    getEmployeeAttendanceHistoryForAdmin: (employeeId, startDate = null, endDate = null) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return axiosInstance.get(`/company/employees/${employeeId}/attendance-history`, { params });
    },
};

export default attendanceService;
