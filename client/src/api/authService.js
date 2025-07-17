import axiosInstance from './axiosInstance';

const authService = {
    // Company Auth
    registerCompany: (data) => axiosInstance.post('/company/register', data),
    verifyCompanyOtp: (data) => axiosInstance.post('/company/verify-otp', data),
    setCompanyPasswordAndCode: (data) => axiosInstance.post('/company/set-password-code', data),
    loginCompany: (credentials) => axiosInstance.post('/company/login', credentials),
    logoutCompany: () => axiosInstance.post('/company/logout'),
    getCompanyDetails: () => axiosInstance.get('/company/details'),

    // Employee Auth
    verifyEmployeeInvite: (data) => axiosInstance.post('/employee/verify-invite', data),
    completeEmployeeProfile: (data) => axiosInstance.post('/employee/complete-profile', data),
    setEmployeePasswordAndVerifyEmail: (data) => axiosInstance.post('/employee/set-password-verify-email', data),
    verifyEmployeeOtp: (data) => axiosInstance.post('/employee/verify-otp', data),
    loginEmployee: (credentials) => axiosInstance.post('/employee/login', credentials),
    logoutEmployee: () => axiosInstance.post('/employee/logout'),
    getEmployeeDetails: () => axiosInstance.get('/employee/details'),
};

export default authService;
