import axios from 'axios';

const TOKEN_KEY = 'unsia_token';
const USER_KEY = 'unsia_user';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Setiap request otomatis membawa Authorization: Bearer <token>.
api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Token kedaluwarsa/ditolak -> bersihkan sesi dan kembalikan ke halaman login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && !error.config?.url?.includes('/auth/login')) {
      tokenStorage.clear();
      if (window.location.pathname !== '/login') {
        window.location.replace('/login?expired=1');
      }
    }
    return Promise.reject(error);
  }
);

// Mengubah error Axios menjadi pesan yang siap ditampilkan di UI.
export function getErrorMessage(error, fallback = 'Terjadi kesalahan, coba lagi.') {
  const data = error?.response?.data;
  if (data?.errors?.length) {
    return data.errors.map((e) => e.message).join(', ');
  }
  if (data?.message) return data.message;
  if (error?.message === 'Network Error') {
    return 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
  }
  return fallback;
}

export default api;
