import axiosInstance from './axiosInstance';

const companyService = {
    // Company Settings
    updateCompanySettings: (data) => axiosInstance.put('/company/settings', data),

    // Employee Management (from Company Admin perspective)
    addEmployee: (data) => axiosInstance.post('/company/employees/add', data),
    getCompanyEmployees: (status = '') => {
        const params = status ? { status } : {};
        return axiosInstance.get('/company/employees', { params });
    },
    getEmployeeById: (employeeId) => axiosInstance.get(`/company/employees/${employeeId}`),
    updateEmployee: (employeeId, data) => axiosInstance.put(`/company/employees/${employeeId}`, data),
    deleteEmployee: (employeeId) => axiosInstance.delete(`/company/employees/${employeeId}`),
    getEmployeeAttendanceHistory: (employeeId, startDate = null, endDate = null) => {
        const params = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;
        return axiosInstance.get(`/company/employees/${employeeId}/attendance-history`, { params });
    },
};

export default companyService;
