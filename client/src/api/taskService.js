import axiosInstance from './axiosInstance';

const taskService = {
    addTask: (description) => axiosInstance.post('/employee/tasks/add', { description }),
    updateTaskStatus: (taskId, status) => axiosInstance.put(`/employee/tasks/${taskId}/status`, { status }),
    getTodayTasks: () => axiosInstance.get('/employee/tasks/today'),
    getHistoricalTasks: (attendanceId) => axiosInstance.get(`/employee/tasks/history/${attendanceId}`),
};

export default taskService;
