import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gymflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('gymflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data, role) => api.post(`/auth/register?role=${role}`, data),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// Members
export const memberApi = {
  getAll: (page = 0, size = 20, search = '') =>
    api.get('/members', { params: { page, size, search: search || undefined } }),
  getById: (id) => api.get(`/members/${id}`),
  getByCode: (code) => api.get(`/members/code/${code}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  deactivate: (id) => api.delete(`/members/${id}`),
};

// Plans
export const planApi = {
  getAll: () => api.get('/plans'),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

// Subscriptions
export const subscriptionApi = {
  create: (data) => api.post('/subscriptions', data),
  getByMember: (memberId) => api.get(`/subscriptions/member/${memberId}`),
  getExpiring: (days = 7) => api.get('/subscriptions/expiring', { params: { days } }),
};

// Payments
export const paymentApi = {
  getAll: (page = 0, size = 20) => api.get('/payments', { params: { page, size } }),
};

// Trainers
export const trainerApi = {
  getAll: () => api.get('/trainers'),
  getById: (id) => api.get(`/trainers/${id}`),
  create: (data) => api.post('/trainers', data),
  update: (id, data) => api.put(`/trainers/${id}`, data),
  delete: (id) => api.delete(`/trainers/${id}`),
};

// Attendance
export const attendanceApi = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (memberId) => api.post(`/attendance/checkout/${memberId}`),
  getAll: (page = 0, size = 20) => api.get('/attendance', { params: { page, size } }),
  getToday: () => api.get('/attendance/today'),
  getByMember: (memberId, page = 0, size = 20) =>
    api.get(`/attendance/member/${memberId}`, { params: { page, size } }),
};

// Biometric
export const biometricApi = {
  enroll: (data) => api.post('/biometric/enroll', data),
  verify: (data) => api.post('/biometric/verify', data),
  getByMember: (memberId) => api.get(`/biometric/member/${memberId}`),
  delete: (id) => api.delete(`/biometric/${id}`),
};

export default api;
