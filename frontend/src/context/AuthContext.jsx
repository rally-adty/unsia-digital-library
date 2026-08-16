import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../api/services';
import { tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  // Saat halaman dimuat ulang, token yang tersimpan diverifikasi ke backend
  // supaya sesi kedaluwarsa tidak terlihat seolah masih login.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((res) => {
        setUser(res.data);
        tokenStorage.setUser(res.data);
      })
      .catch(() => {
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(credentials) {
        const res = await authService.login(credentials);
        tokenStorage.set(res.data.token);
        tokenStorage.setUser(res.data.user);
        setUser(res.data.user);
        return res;
      },
      async register(payload) {
        const res = await authService.register(payload);
        tokenStorage.set(res.data.token);
        tokenStorage.setUser(res.data.user);
        setUser(res.data.user);
        return res;
      },
      logout() {
        tokenStorage.clear();
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider');
  return ctx;
}
