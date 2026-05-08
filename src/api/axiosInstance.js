// api.js
import axios from 'axios';

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
    const username = import.meta.env.VITE_API_USERNAME;
    const password = import.meta.env.VITE_API_PASSWORD;

    config.headers.Authorization = `Basic ${btoa(`${username}:${password}`)}`;

    // 👇 dynamic baseURL switch
    const apiType = config.apiType || 'default';
    config.baseURL = BASE_URLS[apiType];

    return config;
});

API.interceptors.response.use(
    (res) => res,
    (error) => {
        console.error('API Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

export default API;