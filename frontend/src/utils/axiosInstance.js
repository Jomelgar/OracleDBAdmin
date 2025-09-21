// src/utils/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API error:', error.response);
    } else {
      console.error('Error de red:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
