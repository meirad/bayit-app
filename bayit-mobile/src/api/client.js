import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:5001/api',
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = await SecureStore.getItemAsync('refreshToken');

      if (refreshToken) {
        try {
          const refreshBaseURL = original.baseURL || api.defaults.baseURL;
          const refreshRes = await axios.post(`${refreshBaseURL}/auth/refresh`, { refreshToken });
          const nextAccessToken = refreshRes.data?.accessToken;

          if (nextAccessToken) {
            await SecureStore.setItemAsync('accessToken', nextAccessToken);
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${nextAccessToken}`;
            return api(original);
          }
        } catch {
          if (unauthorizedHandler) {
            await unauthorizedHandler();
          }
        }
      } else if (unauthorizedHandler) {
        await unauthorizedHandler();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
