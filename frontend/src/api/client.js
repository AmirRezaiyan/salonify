import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add JWT token to requests
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const salonHost = localStorage.getItem('salon_host');
    if (salonHost) {
      config.headers['X-Salon-Host'] = salonHost;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/accounts/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return client(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('salon_id');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;

export const api = {
  // Auth
  register: (data) => client.post('/accounts/register/', data),
  login: (username, password) => client.post('/accounts/token/', { username, password }),
  refreshToken: (refreshToken) => client.post('/accounts/token/refresh/', { refresh: refreshToken }),
  getCurrentUser: () => client.get('/accounts/me/'),

  // Salons
  getTenantByHost: (host) => client.get(`/tenant/?host=${host}`),
  getTenantById: (id) => client.get(`/tenants/${id}/`),
  getAllSalons: (params) => client.get(`/salons/`, { params }),
  getSalon: (id) => client.get(`/salons/${id}/`),
  updateSalon: (id, data) => client.patch(`/salons/${id}/update/`, data),

  // Services
  getServices: (salonId) => client.get(`/tenants/${salonId}/services/`),
  getAdminServices: () => client.get(`/services/manage/`),
  createService: (data) => client.post(`/services/manage/`, data),
  updateService: (id, data) => client.patch(`/services/manage/${id}/`, data),
  deleteService: (id) => client.delete(`/services/manage/${id}/`),

  // Working Hours
  getWorkingHours: (salonId) => client.get(`/tenants/${salonId}/working-hours/`),
  createWorkingHour: (data) => client.post(`/working-hours/`, data),
  updateWorkingHour: (id, data) => client.patch(`/working-hours/${id}/`, data),
  deleteWorkingHour: (id) => client.delete(`/working-hours/${id}/`),

  // Bookings
  getBookings: (salonId, config) => client.get(`/tenants/${salonId}/bookings/`, config),
  getCustomerBookings: () => client.get(`/bookings/my-bookings/`),
  createBooking: (salonId, data) => client.post(`/tenants/${salonId}/bookings/`, data),
  updateBooking: (salonId, bookingId, data) => client.patch(`/tenants/${salonId}/bookings/${bookingId}/`, data),
  cancelBooking: (salonId, bookingId) => client.patch(`/tenants/${salonId}/bookings/${bookingId}/`, { status: 'cancelled' }),
  calculateDayOfWeek: (dates) => {
    const salonId = localStorage.getItem('selected_salon_id') || localStorage.getItem('salon_id') || '1';
    return client.post(`/tenants/${salonId}/bookings/calculate-day-of-week/`, { dates });
  },
  getPlatformStats: () => client.get(`/stats/`),
  bookingAction: (salonId, bookingId, action) => client.post(`/tenants/${salonId}/bookings/${bookingId}/${action}/`),
  toggleSalonStatus: (action, days, disable_reason) => client.patch(`/salon-status/toggle/`, { action, days, disable_reason }),

  // Reviews
  getReviews: (salonId) => client.get(`/tenants/${salonId}/reviews/`),
  createReview: (salonId, data) => client.post(`/tenants/${salonId}/reviews/`, data),
  ownerReply: (salonId, reviewId, data) => client.post(`/tenants/${salonId}/reviews/${reviewId}/reply/`, data),

  // Portfolio
  getPortfolioCategories: (salonId) => client.get(`/tenants/${salonId}/portfolio/`),
  createPortfolioCategory: (salonId, data) => client.post(`/tenants/${salonId}/portfolio/`, data),
  updatePortfolioCategory: (categoryId, data) => client.patch(`/portfolio/categories/${categoryId}/`, data),
  deletePortfolioCategory: (categoryId) => client.delete(`/portfolio/categories/${categoryId}/`),

  getQRCode: () => client.get('/my-salon/qr-code/'),
  getSalonByQRCode: (qrCode) => client.get(`/salons/qr/${qrCode}/`),
  createPortfolioItem: (categoryId, formData) =>
    client.post(`/portfolio/categories/${categoryId}/items/`, formData),

  updatePortfolioItem: (itemId, data) => client.patch(`/portfolio/items/${itemId}/`, data),
  deletePortfolioItem: (itemId) => client.delete(`/portfolio/items/${itemId}/`),
};