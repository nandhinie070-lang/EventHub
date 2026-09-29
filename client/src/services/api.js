import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventhub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on 401 Unauthorized if not on public auth pages
      const isAuthPage = window.location.pathname.startsWith('/login') ||
                         window.location.pathname.startsWith('/register') ||
                         window.location.pathname.startsWith('/verify-otp') ||
                         window.location.pathname === '/';
      if (!isAuthPage) {
        localStorage.removeItem('eventhub_token');
        localStorage.removeItem('eventhub_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
