import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://shantae-nonperversive-anastasia.ngrok-free.dev';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      await AsyncStorage.clear();
      // You can add navigation logic here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { identifier, password }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getProfile: () =>
    api.get('/auth/me'),
};

// Restaurant API
export const restaurantAPI = {
  getProfile: () =>
    api.get('/restaurants/me'),
  
  updateProfile: (data: any) =>
    api.patch('/restaurants/me', data),
  
  toggleStatus: (isOpen: boolean) =>
    api.post('/restaurants/me/toggle-status', { isOpen }),
  
  setHours: (hours: any[]) =>
    api.post('/restaurants/me/hours', hours),
  
  getTodayEarnings: () =>
    api.get('/restaurants/me/earnings/today'),
};

// Orders API
export const ordersAPI = {
  getActiveOrders: () =>
    api.get('/orders/restaurant/active'),
  
  getAllOrders: (status?: string) =>
    api.get('/orders/restaurant/all', { params: { status } }),
  
  getOrderHistory: (page = 1, limit = 20) =>
    api.get('/orders/restaurant/history', { params: { page, limit } }),
  
  acceptOrder: (orderId: string, estimatedPrepTime: number) =>
    api.post(`/orders/${orderId}/accept`, { estimatedPrepTime }),
  
  rejectOrder: (orderId: string) =>
    api.post(`/orders/${orderId}/reject`),
  
  markOrderReady: (orderId: string) =>
    api.post(`/orders/${orderId}/ready`),
};

// Menu API
export const menuAPI = {
  getCategories: () =>
    api.get('/menu/categories'),
  
  createCategory: (data: any) =>
    api.post('/menu/categories', data),
  
  getMenuItems: () =>
    api.get('/menu/items'),
  
  createMenuItem: (data: any) =>
    api.post('/menu/items', data),
  
  updateMenuItem: (itemId: string, data: any) =>
    api.patch(`/menu/items/${itemId}`, data),
  
  toggleAvailability: (itemId: string, isAvailable: boolean) =>
    api.patch(`/menu/items/${itemId}/toggle-availability`, { isAvailable }),
  
  deleteMenuItem: (itemId: string) =>
    api.delete(`/menu/items/${itemId}`),

  // Add-ons
  createAddon: (menuItemId: string, data: any) =>
    api.post(`/menu/items/${menuItemId}/addons`, data),

  deleteAddon: (addonId: string) =>
    api.delete(`/menu/addons/${addonId}`),

  
  // Image upload - send as base64 string
  uploadImage: async (imageUri: string) => {
    // Read file as base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string;
          const result = await api.post('/menu/items/upload-image', {
            image: base64String,
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
  
  getPopularItems: () =>
    api.get('/menu/popular-items'),
};

export default api;