import { useCallback, useEffect, useState } from 'react';
import { bookService } from '../api/services';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  title: '',
  author: '',
  category: '',
  isbn: '',
  publisher: '',
  year: '',
  stock: 1,
};

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (keyword = '') => {
    setLoading(true);
    try {
      const res = await bookService.list({ limit: 100, search: keyword || undefined });
      setBooks(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data buku.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Efek ini juga yang melakukan pemuatan pertama saat halaman dibuka.
  // Pencarian ditunda 400ms supaya tidak memukul API tiap ketikan.
  useEffect(() => {
    const timer = setTimeout(() => load(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search, load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (book) => {
    setEditingId(book._id);
    setForm({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      publisher: book.publisher || '',
      year: book.year || '',
      stock: book.stock,
    });
    setFormError('');
    setModalOpen(true);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.title.trim()) return 'Judul buku wajib diisi.';
    if (!form.author.trim()) return 'Penulis wajib diisi.';
    if (!form.category.trim()) return 'Kategori wajib diisi.';
    if (form.isbn.trim().length < 5) return 'ISBN minimal 5 karakter.';
    if (form.stock === '' || Number(form.stock) < 0) return 'Stok harus bilangan bulat >= 0.';
    if (form.year && (Number(form.year) < 1500 || Number(form.year) > new Date().getFullYear() + 1)) {
      return 'Tahun terbit tidak valid.';
    }
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const message = validate();
    if (message) {
      setFormError(message);
      return;
    }

    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      isbn: form.isbn.trim(),
      publisher: form.publisher.trim(),
      stock: Number(form.stock),
      ...(form.year ? { year: Number(form.year) } : {}),
    };

    setSaving(true);
    setFormError('');
    try {
      const res = editingId
        ? await bookService.update(editingId, payload)
        : await bookService.create(payload);
      setModalOpen(false);
      setNotice(res.message);
      await load(search.trim());
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan data buku.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (book) => {
    if (!window.confirm(`Hapus buku "${book.title}"?`)) return;
    try {
      const res = await bookService.remove(book._id);
      setNotice(res.message);
      setError('');
      await load(search.trim());
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus buku.'));
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Data Buku</h2>
          <p>Kelola koleksi buku perpustakaan.</p>
        </div>
        <div className="page-actions">
          <input
            className="search"
            placeholder="Cari judul, penulis, atau ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Tambah Buku
          </button>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={notice} onClose={() => setNotice('')} />

      <div className="card">
        {loading ? (
          <Loader label="Memuat data buku..." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>ISBN</th>
                  <th>Tahun</th>
                  <th className="num">Stok</th>
                  <th className="num">Tersedia</th>
                  <th className="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {books.length ? (
                  books.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <strong>{book.title}</strong>
                        <small className="muted-block">{book.author}</small>
                      </td>
                      <td>
                        <span className="badge">{book.category}</span>
                      </td>
                      <td>{book.isbn}</td>
                      <td>{book.year || '-'}</td>
                      <td className="num">{book.stock}</td>
                      <td className="num">
                        <span className={book.available > 0 ? 'ok' : 'warn'}>{book.available}</span>
                      </td>
                      <td className="right nowrap">
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(book)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(book)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      Tidak ada buku yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? 'Edit Data Buku' : 'Tambah Buku Baru'}
        onClose={() => setModalOpen(false)}
      >
        <Alert message={formError} onClose={() => setFormError('')} />
        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Judul *</span>
            <input name="title" value={form.title} onChange={onChange} />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Penulis *</span>
              <input name="author" value={form.author} onChange={onChange} />
            </label>
            <label className="field">
              <span>Kategori *</span>
              <input name="category" value={form.category} onChange={onChange} />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>ISBN *</span>
              <input name="isbn" value={form.isbn} onChange={onChange} />
            </label>
            <label className="field">
              <span>Penerbit</span>
              <input name="publisher" value={form.publisher} onChange={onChange} />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Tahun Terbit</span>
              <input type="number" name="year" value={form.year} onChange={onChange} />
            </label>
            <label className="field">
              <span>Stok *</span>
              <input type="number" name="stock" min="0" value={form.stock} onChange={onChange} />
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
