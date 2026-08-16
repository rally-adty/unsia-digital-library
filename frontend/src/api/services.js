import api from './client';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const bookService = {
  list: (params) => api.get('/books', { params }).then((r) => r.data),
  create: (payload) => api.post('/books', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/books/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/books/${id}`).then((r) => r.data),
};

export const memberService = {
  list: (params) => api.get('/members', { params }).then((r) => r.data),
  create: (payload) => api.post('/members', payload).then((r) => r.data),
  update: (id, payload) => api.put(`/members/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/members/${id}`).then((r) => r.data),
};

export const loanService = {
  list: (params) => api.get('/loans', { params }).then((r) => r.data),
  create: (payload) => api.post('/loans', payload).then((r) => r.data),
  returnBook: (id) => api.put(`/loans/${id}/return`).then((r) => r.data),
  remove: (id) => api.delete(`/loans/${id}`).then((r) => r.data),
};

export const dashboardService = {
  summary: () => api.get('/dashboard/summary').then((r) => r.data),
};
