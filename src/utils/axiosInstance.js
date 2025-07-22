// axiosinstance
import axios from 'axios'
import { BASE_URL } from './apiPaths'

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
})

// request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('token')
        console.log('🔐 Axios Request Interceptor:', {
            url: config.url,
            method: config.method,
            hasToken: !!accessToken,
            tokenLength: accessToken?.length,
            tokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'No token'
        });

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        } else {
            console.warn('⚠️ No token found in localStorage for request to:', config.url);
        }
        return config
    },
    (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error)
    }
);

// response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        console.log('✅ Axios Response Success:', {
            url: response.config.url,
            method: response.config.method,
            status: response.status,
            statusText: response.statusText
        });
        return response;
    },
    (error) => {
        console.error('❌ Axios Response Error:', {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        //  handle common error globally
        if (error.response) {
            if (error.response.status === 401) {
                console.warn('🔐 401 Unauthorized - Redirecting to login');
                // Clear all auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('isAuthenticated');
                // redirect to login
                window.location.href = '/login';
            } else if (error.response.status === 500) {
                console.error("❌ Server Error (500)");
            }
        } else if (error.code === 'ECONNABORTED') {
            console.error("⏰ Request Timed Out");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance