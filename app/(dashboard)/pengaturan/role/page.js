'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';

const PERMISSION_GROUPS = [
  {
    group: 'Dashboard',
    permissions: [
      { key: 'dashboard.view', label: 'Lihat Dashboard' },
      { key: 'dashboard.kas', label: 'Lihat Saldo Kas' },
      { key: 'dashboard.kinerja', label: 'Lihat Kinerja Petugas' },
    ]
  },
  {
    group: 'Pendataan Donatur',
    permissions: [
      { key: 'donatur.view', label: 'Lihat Donatur' },
      { key: 'donatur.create', label: 'Tambah Donatur' },
      { key: 'donatur.edit', label: 'Edit Donatur' },
      { key: 'donatur.delete', label: 'Hapus Donatur' },
    ]
  },
  {
    group: 'Penerimaan Donasi',
    permissions: [
      { key: 'donasi.view', label: 'Akses Modul Penerimaan' },
      { key: 'donasi.create', label: 'Catat Donasi Baru' },
      { key: 'donasi.riwayat', label: 'Lihat Riwayat Sendiri' },
      { key: 'donasi.riwayat_all', label: 'Lihat Semua Riwayat' },
      { key: 'donasi.setor', label: 'Setor ke Bendahara' },
    ]
  },
  {
    group: 'Keuangan',
    permissions: [
      { key: 'keuangan.view', label: 'Akses Modul Keuangan' },
      { key: 'keuangan.verifikasi', label: 'Lihat Verifikasi Setoran' },
      { key: 'keuangan.verifikasi_action', label: 'Aksi Terima/Tolak Setoran' },
      { key: 'keuangan.pengeluaran', label: 'Lihat Pengeluaran' },
      { key: 'keuangan.pengeluaran_create', label: 'Catat Pengeluaran Baru' },
      { key: 'keuangan.buku_kas', label: 'Lihat Buku Kas' },
    ]
  },
  {
    group: 'Laporan',
    permissions: [
      { key: 'laporan.donasi', label: 'Laporan Donasi' },
      { key: 'laporan.penggunaan', label: 'Laporan Penggunaan Dana' },
      { key: 'laporan.mutasi', label: 'Laporan Mutasi Saldo' },
    ]
  },
  {
    group: 'Pengaturan',
    permissions: [
      { key: 'pengaturan.view', label: 'Akses Modul Pengaturan' },
      { key: 'pengaturan.kategori_donasi', label: 'Kelola Kategori Donasi' },
      { key: 'pengaturan.metode_donasi', label: 'Kelola Metode Donasi' },
      { key: 'pengaturan.pos_pengeluaran', label: 'Kelola Pos Pengeluaran' },
      { key: 'pengaturan.users', label: 'Kelola Pengguna' },
      { key: 'pengaturan.roles', label: 'Kelola Role' },
      { key: 'pengaturan.logo', label: 'Kelola Logo' },
    ]
  }
];

export default function ManajemenRolePage() {
  const { roles, addRole, updateRole, deleteRole } = useData();
  const router = useRouter();
  
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', permissions: [] });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openAdd = () => {
    setForm({ id: '', name: '', permissions: [] });
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (role) => {
    setForm({ id: role.id, name: role.name, permissions: [...role.permissions] });
    setEditItem(role);
    setShowForm(true);
  };

  const togglePermission = (permKey) => {
    setForm(prev => {
      const perms = new Set(prev.permissions);
      if (perms.has(permKey)) {
        perms.delete(permKey);
      } else {
        perms.add(permKey);
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const selectAll = (group) => {
    const keys = group.permissions.map(p => p.key);
    setForm(prev => {
      const perms = new Set(prev.permissions);
      keys.forEach(k => perms.add(k));
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const deselectAll = (group) => {
    const keys = group.permissions.map(p => p.key);
    setForm(prev => {
      const perms = new Set(prev.permissions);
      keys.forEach(k => perms.delete(k));
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editItem) {
      updateRole(editItem.id, { name: form.name, permissions: form.permissions });
    } else {
      addRole({ 
        id: form.name.toLowerCase().replace(/[^a-z0-9]/g, '_'), 
        name: form.name, 
        permissions: form.permissions 
      });
    }
    setShowForm(false);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/pengaturan')} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1>Manajemen Role</h1>
            <p>{roles.length} role terdaftar</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> Tambah Role
          </button>
        </div>
      </div>

      <div className="stagger" style={{ display: 'grid', gap: 'var(--space-md)' }}>
        {roles.map(r => (
          <div key={r.id} className="card" style={{ padding: 'var(--space-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '8px', 
                background: 'var(--primary-light)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>{r.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{r.permissions.length} Hak Akses</span>
              </div>
            </div>
            <div className="flex gap-xs">
              <button className="btn btn-ghost btn-icon" onClick={() => openEdit(r)} title="Edit">
                <Edit size={16} />
              </button>
              {r.id !== 'superadmin' && (
                <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(r)} title="Hapus">
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal Add/Edit */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit' : 'Tambah'} Role</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Nama Role *</label>
                  <input type="text" className="form-input" value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} required disabled={editItem?.id === 'superadmin'} />
                </div>
                
                <h4 style={{ marginTop: 'var(--space-md)', marginBottom: 'var(--space-sm)' }}>Daftar Hak Akses</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {PERMISSION_GROUPS.map((group, idx) => {
                    const allChecked = group.permissions.every(p => form.permissions.includes(p.key));
                    return (
                      <div key={idx} style={{ background: 'var(--surface-50)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{group.group}</strong>
                          <div>
                            <button type="button" onClick={() => selectAll(group)} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0 4px' }}>Pilih Semua</button>
                            <button type="button" onClick={() => deselectAll(group)} style={{ fontSize: '0.75rem', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '0 4px' }}>Kosongkan</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                          {group.permissions.map(perm => (
                            <label key={perm.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                              <input 
                                type="checkbox" 
                                checked={form.permissions.includes(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              {perm.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Role</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Role</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus role <strong>{deleteConfirm.name}</strong>? Pengguna yang memiliki role ini mungkin akan kehilangan hak aksesnya.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { deleteRole(deleteConfirm.id); setDeleteConfirm(null); }}>Hapus Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
