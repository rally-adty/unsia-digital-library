import { useCallback, useEffect, useState } from 'react';
import { memberService } from '../api/services';
import { getErrorMessage } from '../api/client';
import Alert from '../components/Alert';
import Loader from '../components/Loader';
import Modal from '../components/Modal';

const EMPTY_FORM = {
  memberCode: '',
  name: '',
  email: '',
  phone: '',
  faculty: '',
  status: 'aktif',
};

export default function Members() {
  const [members, setMembers] = useState([]);
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
      const res = await memberService.list({ limit: 100, search: keyword || undefined });
      setMembers(res.data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal memuat data anggota.'));
    } finally {
      setLoading(false);
    }
  }, []);

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

  const openEdit = (member) => {
    setEditingId(member._id);
    setForm({
      memberCode: member.memberCode,
      name: member.name,
      email: member.email,
      phone: member.phone || '',
      faculty: member.faculty || '',
      status: member.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (form.memberCode.trim().length < 3) return 'Kode anggota minimal 3 karakter.';
    if (form.name.trim().length < 3) return 'Nama minimal 3 karakter.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Format email tidak valid.';
    if (form.phone && !/^[0-9+\-\s]{8,20}$/.test(form.phone.trim())) {
      return 'Nomor telepon tidak valid.';
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
      memberCode: form.memberCode.trim().toUpperCase(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      faculty: form.faculty.trim(),
      status: form.status,
    };

    setSaving(true);
    setFormError('');
    try {
      const res = editingId
        ? await memberService.update(editingId, payload)
        : await memberService.create(payload);
      setModalOpen(false);
      setNotice(res.message);
      await load(search.trim());
    } catch (err) {
      setFormError(getErrorMessage(err, 'Gagal menyimpan data anggota.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (member) => {
    if (!window.confirm(`Hapus anggota "${member.name}"?`)) return;
    try {
      const res = await memberService.remove(member._id);
      setNotice(res.message);
      setError('');
      await load(search.trim());
    } catch (err) {
      setError(getErrorMessage(err, 'Gagal menghapus anggota.'));
    }
  };

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h2>Data Anggota</h2>
          <p>Kelola data anggota perpustakaan.</p>
        </div>
        <div className="page-actions">
          <input
            className="search"
            placeholder="Cari nama, kode, atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            + Tambah Anggota
          </button>
        </div>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={notice} onClose={() => setNotice('')} />

      <div className="card">
        {loading ? (
          <Loader label="Memuat data anggota..." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Telepon</th>
                  <th>Fakultas</th>
                  <th>Status</th>
                  <th className="right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {members.length ? (
                  members.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <strong>{member.memberCode}</strong>
                      </td>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.phone || '-'}</td>
                      <td>{member.faculty || '-'}</td>
                      <td>
                        <span className={`badge ${member.status === 'aktif' ? 'badge-ok' : 'badge-muted'}`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="right nowrap">
                        <button type="button" className="btn btn-sm" onClick={() => openEdit(member)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(member)}
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="empty">
                      Tidak ada anggota yang cocok.
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
        title={editingId ? 'Edit Data Anggota' : 'Tambah Anggota Baru'}
        onClose={() => setModalOpen(false)}
      >
        <Alert message={formError} onClose={() => setFormError('')} />
        <form className="form" onSubmit={onSubmit}>
          <div className="form-row">
            <label className="field">
              <span>Kode Anggota *</span>
              <input name="memberCode" value={form.memberCode} onChange={onChange} placeholder="AGT-007" />
            </label>
            <label className="field">
              <span>Nama *</span>
              <input name="name" value={form.name} onChange={onChange} />
            </label>
          </div>

          <label className="field">
            <span>Email *</span>
            <input type="email" name="email" value={form.email} onChange={onChange} />
          </label>

          <div className="form-row">
            <label className="field">
              <span>Telepon</span>
              <input name="phone" value={form.phone} onChange={onChange} placeholder="0812xxxxxxx" />
            </label>
            <label className="field">
              <span>Fakultas</span>
              <input name="faculty" value={form.faculty} onChange={onChange} />
            </label>
          </div>

          <label className="field">
            <span>Status</span>
            <select name="status" value={form.status} onChange={onChange}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
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
