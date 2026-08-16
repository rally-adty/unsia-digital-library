import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Menjaga seluruh halaman dalam layout agar hanya bisa diakses setelah login.
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Memeriksa sesi..." />;

  if (!isAuthenticated) {
    // `state.from` dipakai agar setelah login pengguna kembali ke halaman tujuan.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
