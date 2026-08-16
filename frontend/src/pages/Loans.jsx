import { useCallback, useEffect, useMemo, useState } from 'react';
import { bookService, loanService, memberService } from '../api/services';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

// Default jatuh tempo: 14 hari dari hari ini, dalam format input[type=date].
function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ book: '', member: '', dueDate: defaultDueDate(), note: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (status = '') => {
    setLoading(true);
    try {
      const res = await loanService.list({ limit: 100, status: status || undefined });
      setLoans(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data peminjaman.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(statusFilter);
  }, [statusFilter, load]);

  // Daftar buku & anggota dipakai untuk isian form peminjaman.
  const loadOptions = useCallback(async () => {
    try {
      const [bookRes, memberRes] = await Promise.all([
        bookService.list({ limit: 100 }),
        memberService.list({ limit: 100, status: 'aktif' }),
      ]);
      setBooks(bookRes.data);
      setMembers(memberRes.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat pilihan buku/anggota.'));
    }
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const availableBooks = useMemo(() => books.filter((b) => b.available > 0), [books]);

  const openCreate = () => {
    setForm({ book: '', member: '', dueDate: defaultDueDate(), note: '' });
    setFormError('');
    setModalOpen(true);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.book) return setFormError('Buku wajib dipilih.');
    if (!form.member) return setFormError('Anggota peminjam wajib dipilih.');
    if (!form.dueDate) return setFormError('Tanggal jatuh tempo wajib diisi.');
    if (new Date(form.dueDate) <= new Date(new Date().toDateString())) {
      return setFormError('Tanggal jatuh tempo harus setelah hari ini.');
    }

    setSaving(true);
    setFormError('');
    try {
      const res = await loanService.create({
        book: form.book,
        member: form.member,
        // Dikirim sebagai ISO agar backend membacanya sebagai akhir hari jatuh tempo.
        dueDate: new Date(`${form.dueDate}T23:59:59`).toISOString(),
        note: form.note.trim(),
      });
      setModalOpen(false);
      setNotice(res.message);
      await Promise.all([load(statusFilter), loadOptions()]);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal mencatat peminjaman.'));
    } finally {
      setSaving(false);
    }
    return undefined;
  };

  const onReturn = async (loan) => {
    if (!window.confirm(`Tandai "${loan.book?.title}" sudah dikembalikan?`)) return;
    try {
      const res = await loanService.returnBook(loan._id);
      setNotice(res.message);
      setError('');
      await Promise.all([load(statusFilter), loadOptions()]);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memproses pengembalian.'));
    }
  };

  const onDelete = async (loan) => {
    if (!window.confirm('Hapus data peminjaman ini?')) return;
    try {
      const res = await loanService.remove(loan._id);
      setNotice(res.message);
      setError('');
      await Promise.all([load(statusFilter), loadOptions()]);
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus data peminjaman.'));
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Transaksi Peminjaman</h2>
          <p>Catat peminjaman baru dan proses pengembalian buku.</p>
        </div>
        <div className="page-actions">
          <select
            className="search"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Semua status</option>
            <option value="dipinjam">Dipinjam</option>
            <option value="dikembalikan">Dikembalikan</option>
          </select>
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Peminjaman Baru
          </button>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={notice} onClose={() => setNotice('')} />

      <div className="card">
        {loading ? (
          <Loader label="Memuat data peminjaman..." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Buku</th>
                  <th>Anggota</th>
                  <th>Tgl Pinjam</th>
                  <th>Jatuh Tempo</th>
                  <th>Tgl Kembali</th>
                  <th>Status</th>
                  <th className="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loans.length ? (
                  loans.map((loan) => {
                    const overdue = loan.status === 'dipinjam' && new Date(loan.dueDate) < new Date();
                    return (
                      <tr key={loan._id}>
                        <td>
                          <strong>{loan.book?.title || '(buku dihapus)'}</strong>
                          <small className="muted-block">{loan.book?.isbn}</small>
                        </td>
                        <td>
                          {loan.member?.name || '(anggota dihapus)'}
                          <small className="muted-block">{loan.member?.memberCode}</small>
                        </td>
                        <td>{formatDate(loan.loanDate)}</td>
                        <td className={overdue ? 'warn' : ''}>{formatDate(loan.dueDate)}</td>
                        <td>{formatDate(loan.returnDate)}</td>
                        <td>
                          {loan.status === 'dikembalikan' ? (
                            <span className="badge badge-ok">dikembalikan</span>
                          ) : (
                            <span className={`badge ${overdue ? 'badge-danger' : 'badge-info'}`}>
                              {overdue ? 'terlambat' : 'dipinjam'}
                            </span>
                          )}
                        </td>
                        <td className="right nowrap">
                          {loan.status === 'dipinjam' && (
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              onClick={() => onReturn(loan)}
                            >
                              Kembalikan
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => onDelete(loan)}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      Belum ada transaksi peminjaman.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title="Catat Peminjaman Baru" onClose={() => setModalOpen(false)}>
        <Alert message={formError} onClose={() => setFormError('')} />
        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Buku *</span>
            <select name="book" value={form.book} onChange={onChange}>
              <option value="">-- pilih buku yang tersedia --</option>
              {availableBooks.map((book) => (
                <option key={book._id} value={book._id}>
                  {book.title} (tersedia {book.available})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Anggota *</span>
            <select name="member" value={form.member} onChange={onChange}>
              <option value="">-- pilih anggota aktif --</option>
              {members.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.memberCode} - {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Jatuh Tempo *</span>
            <input type="date" name="dueDate" value={form.dueDate} onChange={onChange} />
          </label>

          <label className="field">
            <span>Catatan</span>
            <input name="note" value={form.note} onChange={onChange} placeholder="Opsional" />
          </label>

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
