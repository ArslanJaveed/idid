import axiosInstance from './axiosInstance';

const roleService = {
    getRoles: () => axiosInstance.get('/company/roles'),
    getRoleById: (roleId) => axiosInstance.get(`/company/roles/${roleId}`),
    createRole: (data) => axiosInstance.post('/company/roles', data),
    updateRole: (roleId, data) => axiosInstance.put(`/company/roles/${roleId}`, data),
    deleteRole: (roleId) => axiosInstance.delete(`/company/roles/${roleId}`),
};

export default roleService;
