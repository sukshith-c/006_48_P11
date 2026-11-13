import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fsp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('fsp_token');
      localStorage.removeItem('fsp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login:   (data) => api.post('/auth/login', data),
  register:(data) => api.post('/auth/register', data),
  profile: ()     => api.get('/auth/profile')
};

// Reports
export const reportsAPI = {
  submit:        (data)         => api.post('/reports', data),
  getAll:        (params)       => api.get('/reports', { params }),
  getById:       (id)           => api.get(`/reports/${id}`),
  searchByReportId: (reportId)  => api.get(`/reports/search/${reportId}`),
  updateStatus:  (id, data)     => api.put(`/reports/${id}/status`, data)
};

// Handlers
export const handlersAPI = {
  getAll:            ()       => api.get('/handlers'),
  getById:           (id)    => api.get(`/handlers/${id}`),
  updateAvailability:(id, d) => api.put(`/handlers/${id}/availability`, d),
  updateCapacity:    (id, d) => api.put(`/handlers/${id}/capacity`, d)
};

// Routing
export const routingAPI = {
  getZones:    () => api.get('/routing/zones'),
  getTable:    () => api.get('/routing/table'),
  getQueue:    () => api.get('/routing/queue'),
  getDecisions:(params) => api.get('/routing/decisions', { params }),
  dispatch:    (data)   => api.post('/routing/dispatch', data),
  updateZone:  (id, d)  => api.put(`/routing/zones/${id}`, d)
};

// Analytics
export const analyticsAPI = {
  getSummary:    () => api.get('/analytics/summary'),
  getCategories: () => api.get('/analytics/categories'),
  getZones:      () => api.get('/analytics/zones'),
  getStatus:     () => api.get('/analytics/status'),
  getHandlers:   () => api.get('/analytics/handlers')
};

// Tests
export const testsAPI = {
  run:        () => api.post('/tests/run'),
  getResults: () => api.get('/tests/results')
};

export default api;
