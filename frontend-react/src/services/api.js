import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: '/api' // Vite's proxy inside vite.config.js routes this to the Node.js backend
});

// Request interceptor to automatically add the Firebase ID token and Tenant lookup email
api.interceptors.request.use(async (config) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    try {
      // Fetch latest token (Firebase handles caching and refreshing automatically)
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-user-email'] = user.email;
    } catch (error) {
      console.error("Error fetching Firebase token for API request:", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
