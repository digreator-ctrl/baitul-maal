'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Edit, Trash2, Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function PenggunaDetailPage({ params }) {
  const { id } = use(params);
  const { users, roles, updateUser, deleteUser } = useData();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', alamat: '', noWa: '', roles: [], email: '', password: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const foundUser = users.find(u => u.id === id);
    if (foundUser) {
      setUser(foundUser);
    } else {
      router.replace('/pengaturan/pengguna');
    }
  }, [id, users, router]);

  const openEdit = () => {
    setForm({ 
      name: user.name, 
      alamat: user.alamat || '', 
      noWa: user.noWa || '', 
      roles: user.roles || [], 
      email: user.email, 
      password: '' 
    });
    setErrors({});
    setStep(1);
    setShowEditForm(true);
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.name.trim()) newErrors.name = 'Nama Lengkap wajib diisi';
      if (!form.alamat.trim()) newErrors.alamat = 'Alamat wajib diisi';
      if (!form.noWa.trim()) newErrors.noWa = 'No WhatsApp wajib diisi';
    } else if (currentStep === 2) {
      if (form.roles.length === 0) newErrors.roles = 'Minimal pilih satu role';
    } else if (currentStep === 3) {
      if (!form.email.trim()) newErrors.email = 'Email wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (validateStep(3)) {
      const data = { 
        name: form.name, 
        email: form.email, 
        roles: form.roles,
        alamat: form.alamat,
        noWa: form.noWa,
        avatar: form.name.substring(0, 2).toUpperCase()
      };
      if (form.password) data.password = form.password;
      updateUser(user.id, data);
      setShowEditForm(false);
    }
  };

  const handleDelete = () => {
    deleteUser(user.id);
    setDeleteConfirm(false);
    router.replace('/pengaturan/pengguna');
  };

  const toggleRole = (roleId) => {
    setForm(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId];
      if (newRoles.length > 0) setErrors(prevErr => ({ ...prevErr, roles: undefined }));
      return { ...prev, roles: newRoles };
    });
  };

  const getRoleName = (roleId) => {
    const roleObj = roles.find(r => r.id === roleId);
    return roleObj ? roleObj.name : roleId;
  };

  const availableRoles = roles.filter(r => r.id !== 'superadmin');

  if (!user) return null;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/pengaturan/pengguna')} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1>Detail Pengguna</h1>
            <p>Informasi profil dan akses pengguna</p>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-secondary btn-sm" onClick={openEdit}>
              <Edit size={16} /> Edit
            </button>
            {!user.roles?.includes('superadmin') && (
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(true)}>
                <Trash2 size={16} /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: `linear-gradient(135deg, var(--primary), var(--primary-dark))`,
            color: 'var(--text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 'bold'
          }}>
            {user.avatar}
          </div>
          <div>
            <h2 style={{ marginBottom: '8px' }}>{user.name}</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {user.roles?.map(roleId => (
                <span key={roleId} className="badge badge-neutral" style={{ marginBottom: '8px' }}>
                  <Shield size={12} /> {getRoleName(roleId)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="info-group">
            <label className="info-label"><Mail size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Email</label>
            <div className="info-value">{user.email}</div>
          </div>
          <div className="info-group">
            <label className="info-label"><Phone size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> No. WhatsApp</label>
            <div className="info-value">{user.noWa || '-'}</div>
          </div>
        </div>
        
        <div className="info-group" style={{ marginTop: 'var(--space-md)' }}>
          <label className="info-label"><MapPin size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} /> Alamat</label>
          <div className="info-value">{user.alamat || '-'}</div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Edit Pengguna</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit} noValidate>
              <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {/* Step indicator */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)' }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ 
                      flex: 1, height: '4px', borderRadius: '2px',
                      background: step >= s ? 'var(--primary)' : 'var(--border-color)',
                      transition: 'background 0.3s'
                    }} />
                  ))}
                </div>

                {step === 1 && (
                  <div className="animate-fade-in">
                    <div className="form-group">
                      <label className="form-label">Nama Lengkap *</label>
                      <input type="text" className="form-input" style={{ borderColor: errors.name ? 'var(--danger)' : undefined }} value={form.name} onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); }} />
                      {errors.name && <span className="form-error">{errors.name}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Alamat *</label>
                      <textarea className="form-textarea" style={{ minHeight: '60px', borderColor: errors.alamat ? 'var(--danger)' : undefined }} value={form.alamat} onChange={(e) => { setForm(prev => ({ ...prev, alamat: e.target.value })); if (errors.alamat) setErrors(prev => ({ ...prev, alamat: undefined })); }} />
                      {errors.alamat && <span className="form-error">{errors.alamat}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">No WhatsApp *</label>
                      <input type="tel" className="form-input" style={{ borderColor: errors.noWa ? 'var(--danger)' : undefined }} value={form.noWa} onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setForm(prev => ({ ...prev, noWa: val }));
                        if (errors.noWa) setErrors(prev => ({ ...prev, noWa: undefined }));
                      }} placeholder="Hanya angka" />
                      {errors.noWa && <span className="form-error">{errors.noWa}</span>}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-fade-in">
                    <div className="form-group">
                      <label className="form-label">Role Pengguna (Bisa pilih lebih dari satu) *</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', padding: '16px', background: 'var(--surface-50)', borderRadius: 'var(--radius-md)', border: `1px solid ${errors.roles ? 'var(--danger)' : 'var(--border-color)'}` }}>
                        {availableRoles.map((r) => (
                          <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{r.name}</span>
                            <label className="toggle-switch">
                              <input 
                                type="checkbox" 
                                checked={form.roles.includes(r.id)}
                                onChange={() => toggleRole(r.id)}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                          </div>
                        ))}
                      </div>
                      {errors.roles && <span className="form-error">{errors.roles}</span>}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-fade-in">
                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input type="email" className="form-input" style={{ borderColor: errors.email ? 'var(--danger)' : undefined }} value={form.email} onChange={(e) => { setForm(prev => ({ ...prev, email: e.target.value })); if (errors.email) setErrors(prev => ({ ...prev, email: undefined })); }} />
                      {errors.email && <span className="form-error">{errors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password (kosongkan jika tidak diubah)</label>
                      <input type="password" className="form-input" value={form.password} onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEditForm(false)}>Batal</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {step > 1 && (
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>Kembali</button>
                  )}
                  {step < 3 ? (
                    <button type="button" className="btn btn-primary" onClick={handleNext}>
                      Lanjut
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Pengguna</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus pengguna <strong>{user.name}</strong>? Data yang telah dihapus tidak dapat dikembalikan.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleDelete}>Hapus Pengguna</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .info-group {
          margin-bottom: var(--space-md);
        }
        .info-label {
          display: block;
          font-size: 0.75rem;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 0.9375rem;
          color: var(--text-primary);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
