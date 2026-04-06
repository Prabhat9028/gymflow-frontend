import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });
api.interceptors.request.use(c => { const t = localStorage.getItem('gf_token'); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });
api.interceptors.response.use(r => r, e => { if (e.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; } return Promise.reject(e); });
const bp = () => localStorage.getItem('gf_branch');
const cp = () => localStorage.getItem('gf_company');

export const authApi = { login: d => api.post('/auth/login', d), switchBranch: bid => api.post('/auth/switch-branch', { branchId: bid }) };
export const dashboardApi = { getStats: () => api.get('/dashboard', { params: { branchId: bp() }}) };
export const memberApi = {
  getAll: (p=0,s=20,q='') => api.get('/members', { params: { branchId: bp(), page: p, size: s, search: q||undefined }}),
  searchGlobal: (q,p=0,s=20) => api.get('/members/search-global', { params: { branchId: bp(), q, page: p, size: s }}),
  getById: id => api.get(`/members/${id}`), create: d => api.post('/members', d, { params: { branchId: bp() }}),
  update: (id,d) => api.put(`/members/${id}`, d), deactivate: id => api.delete(`/members/${id}`),
  enrollBiometric: (id, serial) => api.post(`/members/${id}/enroll-biometric`, null, { params: { deviceSerial: serial }})
};
export const planApi = { getAll: () => api.get('/plans', { params: { branchId: bp() }}), create: d => api.post('/plans', d, { params: { branchId: bp(), companyId: cp() }}) };
export const subscriptionApi = {
  create: d => api.post('/subscriptions', d), edit: (id, d) => api.put(`/subscriptions/${id}`, d),
  getByMember: mid => api.get(`/subscriptions/member/${mid}`),
  getExpiring: (days=7) => api.get('/subscriptions/expiring', { params: { branchId: bp(), days }})
};
export const paymentApi = {
  getAll: (p=0,s=20,from=null,to=null) => api.get('/payments', { params: { branchId: bp(), page: p, size: s, from: from||undefined, to: to||undefined }}),
  collectBalance: d => api.post('/payments/collect-balance', d),
};
export const trainerApi = { getAll: () => api.get('/trainers', { params: { branchId: bp() }}), create: d => api.post('/trainers', d, { params: { branchId: bp(), companyId: cp() }}), delete: id => api.delete(`/trainers/${id}`) };
export const attendanceApi = { checkIn: d => api.post('/attendance/checkin', d, { params: { branchId: bp() }}), checkOut: mid => api.post(`/attendance/checkout/${mid}`), getToday: () => api.get('/attendance/today', { params: { branchId: bp() }}), getByDate: date => api.get('/attendance/by-date', { params: { branchId: bp(), date }}), getAll: (p=0,s=20) => api.get('/attendance', { params: { branchId: bp(), page: p, size: s }}) };
export const staffApi = {
  getAll: (p=0,s=20,q='') => api.get('/staff', { params: { branchId: bp(), page: p, size: s, search: q||undefined }}),
  create: d => api.post('/staff', d, { params: { branchId: bp(), companyId: cp() }}), deactivate: id => api.delete(`/staff/${id}`),
  checkIn: d => api.post('/staff/attendance/checkin', d, { params: { branchId: bp() }}), checkOut: sid => api.post(`/staff/attendance/checkout/${sid}`),
  getTodayAttendance: () => api.get('/staff/attendance/today', { params: { branchId: bp() }})
};
export const biometricApi = {
  getDevices: () => api.get('/biometric/devices', { params: { branchId: bp() }}),
  addDevice: d => api.post('/biometric/devices', d, { params: { branchId: bp(), companyId: cp() }}),
  deleteDevice: id => api.delete(`/biometric/devices/${id}`),
  pullAttendance: serial => api.post('/biometric/pull-attendance', null, { params: { deviceSerial: serial }})
};
export const reportApi = {
  getMembershipReport: (params={}) => api.get('/reports/membership', { params: { branchId: bp(), ...params }}),
  getPendingPayments: (params={}) => api.get('/reports/pending-payments', { params: { branchId: bp(), ...params }}),
  exportMembership: (params={}) => api.get('/reports/membership/export', { params: { branchId: bp(), ...params }, responseType: 'blob' }),
  exportPendingPayments: (params={}) => api.get('/reports/pending-payments/export', { params: { branchId: bp(), ...params }, responseType: 'blob' }),
  exportPlanDistribution: (params={}) => api.get('/reports/plan-distribution/export', { params: { branchId: bp(), ...params }, responseType: 'blob' }),
};
export const gymApi = {
  getAll: () => api.get('/gyms'), getById: id => api.get(`/gyms/${id}`),
  create: d => api.post('/gyms', d), update: (id, d) => api.put(`/gyms/${id}`, d), deactivate: id => api.delete(`/gyms/${id}`),
  getBranches: companyId => api.get(`/gyms/${companyId}/branches`),
  createBranch: (companyId, d) => api.post(`/gyms/${companyId}/branches`, d),
  updateBranch: (branchId, d) => api.put(`/gyms/branches/${branchId}`, d),
  deactivateBranch: branchId => api.delete(`/gyms/branches/${branchId}`),
};
export const uploadApi = {
  upload: (file, type='general') => { const fd = new FormData(); fd.append('file', file); fd.append('type', type); return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' }}); },
  importMembers: (file, branchId) => { const fd = new FormData(); fd.append('file', file); return api.post('/import/members', fd, { params: { branchId }, headers: { 'Content-Type': 'multipart/form-data' }}); },
};
export const churnApi = {
  getPredictions: () => api.get('/ai/churn', { params: { branchId: bp() }}),
};
export const leadApi = {
  getAll: (p=0,s=20,q='') => api.get('/leads', { params: { branchId: bp(), page: p, size: s, search: q||undefined }}),
  getById: id => api.get(`/leads/${id}`),
  create: d => api.post('/leads', d, { params: { branchId: bp() }}),
  update: (id, d) => api.put(`/leads/${id}`, d),
  updateStatus: (id, d) => api.put(`/leads/${id}/status`, d),
  convert: id => api.post(`/leads/${id}/convert`),
  getActivities: id => api.get(`/leads/${id}/activities`),
  addActivity: (id, d) => api.post(`/leads/${id}/activities`, d),
  byStatus: status => api.get('/leads/by-status', { params: { branchId: bp(), status }}),
  getDashboard: () => api.get('/leads/dashboard', { params: { branchId: bp() }}),
};
export default api;
