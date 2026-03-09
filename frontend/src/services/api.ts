import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Staff/Therapist endpoints
export const staffApi = {
  getAll: () => api.get('/staff'),
  getAvailable: (date: string, treatment?: string) => 
    api.get('/staff/available', { params: { date, treatment } }),
  getById: (id: string) => api.get(`/staff/${id}`),
};

// Appointment endpoints
export const appointmentApi = {
  create: (data: any) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments/my'),
  getPending: () => api.get('/appointments/pending'),
  approve: (id: string, data: any) => api.put(`/appointments/${id}/approve`, data),
  reject: (id: string, reason: string) => api.put(`/appointments/${id}/reject`, { reason }),
};

// Treatment endpoints
export const treatmentApi = {
  getAll: () => api.get('/treatments'),
  predict: (data: any) => api.post('/treatments/predict', data),
};

export default api;