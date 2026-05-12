import axios from 'axios';
import { getAuth } from 'firebase/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
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
      // NOTE: Do NOT send x-user-email header — it is a dev bypass that could be exploited.
      // The Firebase Bearer token is the sole source of identity.
    } catch (error) {
      console.error("Error fetching Firebase token for API request:", error);
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
