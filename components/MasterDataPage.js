'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function MasterDataPage({
  title, description, items, icon,
  onAdd, onUpdate, onDelete,
  fields = [
    { key: 'nama', label: 'Nama', type: 'text', required: true },
    { key: 'deskripsi', label: 'Deskripsi', type: 'text', required: false },
  ],
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openAdd = () => {
    const init = {};
    fields.forEach(f => { init[f.key] = ''; });
    setForm(init);
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({ ...item });
    setEditItem(item);
    setShowForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      onUpdate(editItem.id, form);
    } else {
      onAdd(form);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleToggle = (item) => {
    onUpdate(item.id, { aktif: !item.aktif });
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/pengaturan')} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="stagger">
        {items.length === 0 ? (
          <div className="empty-state">
            {icon}
            <h3>Belum ada data</h3>
            <p>Tambahkan data baru dengan menekan tombol di atas.</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="list-item" style={{ cursor: 'default' }}>
              <div className="list-item-content">
                <div className="list-item-title flex items-center gap-sm">
                  {item.nama}
                  {item.aktif !== undefined && (
                    <span className={`badge ${item.aktif ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '0.625rem' }}>
                      {item.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  )}
                </div>
                {item.deskripsi && <div className="list-item-subtitle">{item.deskripsi}</div>}
              </div>
              <div className="flex gap-xs items-center">
                {item.aktif !== undefined && (
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => handleToggle(item)}
                    title={item.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {item.aktif ? <ToggleRight size={20} color="var(--primary)" /> : <ToggleLeft size={20} />}
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)} title="Edit">
                  <Edit size={16} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(item)} title="Hapus">
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit' : 'Tambah'} {title}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {fields.map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label} {f.required && '*'}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        className="form-textarea"
                        value={form[f.key] || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        required={f.required}
                      />
                    ) : (
                      <input
                        type={f.type || 'text'}
                        className="form-input"
                        value={form[f.key] || ''}
                        onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        required={f.required}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Data</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus <strong>{deleteConfirm.nama}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { onDelete(deleteConfirm.id); setDeleteConfirm(null); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
