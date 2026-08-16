import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';

const EMPTY = { name: '', email: '', password: '', confirmPassword: '', role: 'petugas' };

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (form.name.trim().length < 3) return 'Nama minimal 3 karakter.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Format email tidak valid.';
    if (form.password.length < 6) return 'Password minimal 6 karakter.';
    if (!/\d/.test(form.password)) return 'Password harus mengandung minimal satu angka.';
    if (form.password !== form.confirmPassword) return 'Konfirmasi password tidak cocok.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registrasi gagal.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">UL</span>
          <h1>Daftar Akun Pengelola</h1>
          <p>Buat akun untuk mengakses dashboard perpustakaan.</p>
        </div>

        <Alert message={error} onClose={() => setError('')} />

        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Nama Lengkap</span>
            <input name="name" value={form.name} onChange={onChange} placeholder="Nama pengelola" />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="nama@unsia.ac.id"
            />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="Minimal 6 karakter + angka"
              />
            </label>

            <label className="field">
              <span>Konfirmasi Password</span>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={onChange}
                placeholder="Ulangi password"
              />
            </label>
          </div>

          <label className="field">
            <span>Peran</span>
            <select name="role" value={form.role} onChange={onChange}>
              <option value="petugas">Petugas</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Memproses...' : 'Daftar'}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
