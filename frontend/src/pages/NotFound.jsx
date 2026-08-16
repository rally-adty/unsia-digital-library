import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <span className="notfound-code">404</span>
        <h1>Halaman tidak ditemukan</h1>
        <p>Alamat yang Anda tuju tidak tersedia atau sudah dipindahkan.</p>
        <Link to={isAuthenticated ? '/dashboard' : '/login'} className="btn btn-primary">
          {isAuthenticated ? 'Kembali ke Dashboard' : 'Ke Halaman Login'}
        </Link>
      </div>
    </div>
  );
}
