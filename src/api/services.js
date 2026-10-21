import http from './client';
import { api as mockApi } from './mock';

// "true" (default) -> built-in demo data. "false" -> real FastAPI backend.
export const USE_MOCK = String(import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';

const d = (p) => p.then((r) => r.data);

// Real backend. Every route is documented in API_CONTRACT.md.
const real = {
  // auth
  login: (email, password) => d(http.post('/auth/login', { email, password })),
  register: (payload) => d(http.post('/auth/register', payload)),
  verifyOtp: (email, otp) => d(http.post('/auth/verify-otp', { email, otp })),
  resendOtp: (email) => d(http.post('/auth/resend-otp', { email })),
  me: () => d(http.get('/auth/me')),
  updateProfile: (payload) => d(http.patch('/users/me', payload)),
  // farms
  listFarms: () => d(http.get('/farms')),
  saveFarm: (p) => (p._id ? d(http.put(`/farms/${p._id}`, p)) : d(http.post('/farms', p))),
  deleteFarm: (id) => d(http.delete(`/farms/${id}`)),
  // animals (registered inside a farm)
  listAnimals: (farmId) => d(http.get('/animals', { params: farmId ? { farmId } : {} })),
  saveAnimal: (p) => {
    const fd = new FormData();
    ['farmId', 'animalTag', 'breed', 'ageYears', 'gender', 'weightKg'].forEach((k) => {
      if (p[k] !== undefined && p[k] !== null && p[k] !== '') fd.append(k, p[k]);
    });
    if (p.photoFile) fd.append('photo', p.photoFile);
    if (p.removePhoto) fd.append('removePhoto', 'true');
    return p._id ? d(http.put(`/animals/${p._id}`, fd)) : d(http.post('/animals', fd));
  },
  deleteAnimal: (id) => d(http.delete(`/animals/${id}`)),
  // detection and records
  detectDisease: (farmId, animalId, file) => {
    const fd = new FormData();
    fd.append('farmId', farmId);
    fd.append('animalId', animalId);
    fd.append('image', file);
    return d(http.post('/detections', fd));
  },
  listRecords: (params = {}) => d(http.get('/health-records', { params })),
  listDiseases: () => d(http.get('/diseases')),
  // chatbot
  sendChatMessage: (p) => d(http.post('/chat/message', p)),
  // risk
  listRisk: (params) => d(http.get('/risk-predictions', { params })),
  // vets and appointments
  listVets: (region) => d(http.get('/vets', { params: region ? { region } : {} })),
  listAppointments: () => d(http.get('/appointments')),
  bookAppointment: (p) => d(http.post('/appointments', p)),
  updateAppointment: (id, p) => d(http.patch(`/appointments/${id}/status`, p)),
  savePrescription: (appointmentId, p) => d(http.post(`/appointments/${appointmentId}/prescription`, p)),
  listPrescriptions: () => d(http.get('/prescriptions')),
  saveAvailability: (slots) => d(http.put('/users/me/availability', { availableSlots: slots })),
  // marketplace
  listCategories: () => d(http.get('/categories')),
  listProducts: () => d(http.get('/products')),
  placeOrder: (p) => d(http.post('/orders', p)),
  listOrders: () => d(http.get('/orders')),
  updateOrder: (id, p) => d(http.patch(`/orders/${id}/status`, p)),
  // notifications and feedback
  listNotifications: () => d(http.get('/notifications')),
  markNotificationRead: (id) => d(http.patch(`/notifications/${id}/read`)),
  markAllRead: () => d(http.patch('/notifications/read-all')),
  sendFeedback: (p) => d(http.post('/feedback', p)),
  // admin
  adminStats: () => d(http.get('/admin/stats')),
  adminUsers: () => d(http.get('/admin/users')),
  adminSetUserStatus: (id, status) => d(http.patch(`/admin/users/${id}/status`, { status })),
  adminDeleteUser: (id) => d(http.delete(`/admin/users/${id}`)),
  adminListProducts: () => d(http.get('/admin/products')),
  adminSaveCategory: (p) => (p._id ? d(http.put(`/admin/categories/${p._id}`, p)) : d(http.post('/admin/categories', p))),
  adminDeleteCategory: (id) => d(http.delete(`/admin/categories/${id}`)),
  adminSaveProduct: (p) => (p.productId ? d(http.put(`/admin/products/${p.productId}`, p)) : d(http.post('/admin/products', p))),
  adminDeleteProduct: (id) => d(http.delete(`/admin/products/${id}`)),
  adminSaveDisease: (p) => d(http.put(`/admin/diseases/${p.id}`, p)),
  adminListFeedback: () => d(http.get('/admin/feedback')),
  adminUpdateFeedback: (id, status) => d(http.patch(`/admin/feedback/${id}`, { status })),
};

export const api = USE_MOCK ? mockApi : real;
