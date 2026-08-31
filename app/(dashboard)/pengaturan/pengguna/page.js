'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Plus, Users, Shield } from 'lucide-react';

export default function PenggunaPage() {
  const { users, roles, addUser, fetchUsers } = useData();
  const router = useRouter();

  useEffect(() => {
    if (fetchUsers) fetchUsers();
  }, [fetchUsers]);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', alamat: '', noWa: '', roles: [], email: '', password: '' });
  const [errors, setErrors] = useState({});

  const openAdd = () => {
    setForm({ name: '', alamat: '', noWa: '', roles: [], email: '', password: '' });
    setErrors({});
    setStep(1);
    setShowForm(true);
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
      if (!form.password.trim()) newErrors.password = 'Password wajib diisi';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(3)) {
      addUser({
        ...form,
        avatar: form.name.substring(0, 2).toUpperCase()
      });
      setShowForm(false);
    }
  };

  const toggleRole = (roleId) => {
    setForm(prev => {
      const newRoles = prev.roles.includes(roleId)
        ? prev.roles.filter(r => r !== roleId)
        : [...prev.roles, roleId];
      // clear error if roles become valid
      if (newRoles.length > 0) setErrors(prevErr => ({ ...prevErr, roles: undefined }));
      return { ...prev, roles: newRoles };
    });
  };

  const getRoleName = (roleId) => {
    const roleObj = roles.find(r => r.id === roleId);
    return roleObj ? roleObj.name : roleId;
  };

  const availableRoles = roles.filter(r => r.id !== 'superadmin');

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/pengaturan')} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1>Manajemen Pengguna</h1>
            <p>{users.length} pengguna terdaftar</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      <div className="stagger">
        {users.map(u => (
          <div key={u.id} className="list-item" style={{ cursor: 'pointer' }} onClick={() => router.push(`/pengaturan/pengguna/${u.id}`)}>
            <div className="list-item-avatar" style={{
              background: `linear-gradient(135deg, var(--primary), var(--primary-dark))`,
              color: 'var(--text-inverse)',
              flexShrink: 0
            }}>
              {u.avatar}
            </div>
            <div className="list-item-content" style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div className="list-item-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                {u.roles?.map(roleId => (
                  <span key={roleId} className="badge badge-neutral" style={{ flexShrink: 0 }}>
                    <Shield size={10} />
                    {getRoleName(roleId)}
                  </span>
                ))}
              </div>
              <div className="list-item-subtitle" style={{ fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{u.email}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Form Modal Add */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>Tambah Pengguna</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
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
                      <label className="form-label">Password *</label>
                      <input type="password" className="form-input" style={{ borderColor: errors.password ? 'var(--danger)' : undefined }} value={form.password} onChange={(e) => { setForm(prev => ({ ...prev, password: e.target.value })); if (errors.password) setErrors(prev => ({ ...prev, password: undefined })); }} />
                      {errors.password && <span className="form-error">{errors.password}</span>}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {step > 1 && (
                    <button type="button" className="btn btn-secondary" onClick={() => setStep(step - 1)}>Kembali</button>
                  )}
                  {step < 3 ? (
                    <button type="button" className="btn btn-primary" onClick={handleNext}>
                      Lanjut
                    </button>
                  ) : (
                    <button type="submit" className="btn btn-primary">Simpan</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
