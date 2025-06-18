import axios from 'axios';
import { API_BASE_URL } from './config';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, 
    headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API call error:', error.response || error.message);
        if (error.response && error.response.status === 401) {
        }
        return Promise.reject(error);
    }
);


export default apiClient;