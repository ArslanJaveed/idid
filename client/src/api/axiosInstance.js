import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api', // IMPORTANT: Update with your Laravel API URL
    withCredentials: true, // Required for Sanctum CSRF protection
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});
const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // Add this
    headers: {
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
// Request interceptor to add Authorization header
axiosInstance.interceptors.request.use(
    async (config) => {
        // Fetch CSRF cookie if it's a POST, PUT, PATCH, or DELETE request
        if (['post', 'put', 'patch', 'delete'].includes(config.method)) {
            try {
                await axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true }); // Ensure this URL is correct
            } catch (error) {
                console.error("Failed to get CSRF cookie:", error);
                // You might want to handle this more gracefully, e.g., throw an error
                // or redirect to login. For now, we'll just log.
            }
        }

        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling (e.g., 401 Unauthorized)
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await axios.get('/sanctum/csrf-cookie');
            return axiosInstance(error.config);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
