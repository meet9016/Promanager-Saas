// api.js
import axios from 'axios';
import Cookies from 'js-cookie';

const API = axios.create({
    timeout: 30000,
});

// 🔥 Base URL mapper
const BASE_URLS = {
    default: import.meta.env.VITE_API_BASE_URL,
    payment: import.meta.env.VITE_PAYMENT_URL,
    web: import.meta.env.VITE_WEB_API_BASE_URL,
};

// Request interceptor
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // 👇 dynamic baseURL switch
    const apiType = config.apiType || 'default';
    config.baseURL = BASE_URLS[apiType];

    return config;
});

// Flag to prevent multiple simultaneous logout redirects
let isLoggingOut = false;

API.interceptors.response.use(
    (res) => res,
    (error) => {
        const status = error.response?.status;

        console.error('API Error:', {
            status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });

        // 🔐 401 Unauthorized - auto logout and redirect to HeroSection (/)
        if (
            status === 401 &&
            !isLoggingOut &&
            !error.config?.url?.includes('software_config')
        ) {
            isLoggingOut = true;

            // Clear all auth-related cookies
            Cookies.remove('auth_user');
            Cookies.remove('permissions');

            // Clear all storage
            localStorage.clear();
            sessionStorage.clear();

            // Redirect to HeroSection (Landing Page)
            window.location.href = '/';
        }

        return Promise.reject(error);
    }
);

export default API;