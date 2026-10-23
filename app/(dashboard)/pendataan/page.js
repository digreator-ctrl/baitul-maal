'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { Users, Plus, Search, MapPin, UserCheck, User, CheckSquare, Square, X, Filter } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';

export default function PendataanPage() {
  const { user } = useAuth();
  const { donatur, donasi, users, deleteDonatur, fetchDonatur, assignDonatur } = useData();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [filterPetugas, setFilterPetugas] = useState('semua');
  const [sortBy, setSortBy] = useState('abjad-asc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Bulk assignment state for Admin / Superadmin
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [targetPetugasId, setTargetPetugasId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (fetchDonatur) fetchDonatur();
  }, [fetchDonatur]);

  const userRoles = user?.roles || (user?.roleId ? [user.roleId] : []);
  const isAdminOrSuperAdmin = userRoles.some(r => ['superadmin', 'admin'].includes(r)) || ['superadmin', 'admin'].includes(user?.role);

  // List of active Petugas users
  const petugasList = useMemo(() => {
    return (users || []).filter(u => {
      const rList = u.roles || (u.roleId ? [u.roleId] : []);
      return rList.includes('petugas');
    });
  }, [users]);

  // Petugas lookup map
  const petugasMap = useMemo(() => {
    const map = {};
    (users || []).forEach(u => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const filtered = useMemo(() => {
    let result = donatur.filter(d => {
      const kotaText = (d.kota || d.kabupaten || '').toLowerCase();
      const matchSearch = d.nama.toLowerCase().includes(search.toLowerCase()) ||
        (d.noWa || '').includes(search) ||
        kotaText.includes(search.toLowerCase());
      
      const matchKategori = filterKategori === 'semua' || d.kategori === filterKategori;

      // Filter Petugas (hanya untuk Admin & Super Admin)
      let matchPetugas = true;
      if (isAdminOrSuperAdmin && filterPetugas !== 'semua') {
        if (filterPetugas === 'unassigned') {
          matchPetugas = !d.petugasId;
        } else {
          matchPetugas = d.petugasId === filterPetugas;
        }
      }

      return matchSearch && matchKategori && matchPetugas;
    });

    if (sortBy === 'abjad-asc') {
      result.sort((a, b) => a.nama.localeCompare(b.nama));
    } else if (sortBy === 'abjad-desc') {
      result.sort((a, b) => b.nama.localeCompare(a.nama));
    } else if (sortBy === 'terbaru') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'terlama') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    return result;
  }, [donatur, search, filterKategori, filterPetugas, sortBy, isAdminOrSuperAdmin]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(d => d.id));
    }
  };

  const handleExecuteBulkAssign = async () => {
    if (selectedIds.length === 0 || !targetPetugasId) return;

    setIsAssigning(true);
    const finalPetugasId = targetPetugasId === 'none' ? null : targetPetugasId;
    const ok = await assignDonatur(selectedIds, finalPetugasId);
    setIsAssigning(false);

    if (ok) {
      setSelectedIds([]);
      setTargetPetugasId('');
      setIsBulkMode(false);
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: '4px' }}>Pendataan Donatur</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {isAdminOrSuperAdmin 
                ? `Total ${donatur.length} donatur terdaftar (Kelola dan bagikan tugas donatur ke petugas)` 
                : `Total ${filtered.length} donatur binaan Anda`}
            </p>
          </div>
          
          <div className="page-header-actions flex gap-xs flex-wrap">
            {isAdminOrSuperAdmin && (
              <button 
                className={`btn ${isBulkMode ? 'btn-warning' : 'btn-secondary'}`}
                onClick={() => {
                  setIsBulkMode(!isBulkMode);
                  setSelectedIds([]);
                }}
              >
                <UserCheck size={18} /> {isBulkMode ? 'Batal Pembagian' : 'Bagi Tugas Donatur'}
              </button>
            )}

            {hasPermission(user, 'donatur.create') && (
              <button className="btn btn-primary" onClick={() => router.push('/pendataan/tambah')}>
                <Plus size={18} /> Tambah Donatur
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar for Admin / Superadmin */}
      {isAdminOrSuperAdmin && isBulkMode && (
        <div 
          className="card mb-md animate-fade-in" 
          style={{ 
            background: 'var(--primary-bg)', 
            borderColor: 'var(--primary)',
            padding: '16px 20px',
            borderWidth: '1.5px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleSelectAll}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '4px 8px' }}
              >
                {selectedIds.length === filtered.length && filtered.length > 0 ? (
                  <CheckSquare size={18} color="var(--primary)" />
                ) : (
                  <Square size={18} color="var(--text-secondary)" />
                )}
                <span>Pilih Semua ({filtered.length})</span>
              </button>

              <span className="badge badge-primary font-semibold" style={{ fontSize: '13px', padding: '6px 12px' }}>
                {selectedIds.length} Donatur Dipilih
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                style={{ minWidth: '220px', padding: '8px 12px', fontSize: '0.875rem' }}
                value={targetPetugasId}
                onChange={(e) => setTargetPetugasId(e.target.value)}
              >
                <option value="">-- Pilih Petugas Penerima --</option>
                {petugasList.map(p => (
                  <option key={p.id} value={p.id}>Tugaskan ke: {p.name}</option>
                ))}
                <option value="none">⚠️ Lepas Penugasan (Tanpa Petugas)</option>
              </select>

              <button 
                type="button" 
                className="btn btn-primary"
                disabled={selectedIds.length === 0 || !targetPetugasId || isAssigning}
                onClick={handleExecuteBulkAssign}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isAssigning ? 'Memproses...' : 'Terapkan Penugasan'}
              </button>

              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => { setIsBulkMode(false); setSelectedIds([]); }}
                title="Tutup mode pembagian"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="search-bar mb-md">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Cari nama, no WA, atau kota..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-bar" style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '20px', marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Kategori:</span>
          <CustomSelect 
            value={filterKategori} 
            onChange={(val) => setFilterKategori(val)}
            options={[
              { value: 'semua', label: 'Semua Kategori' },
              { value: 'Keluarga', label: 'Keluarga' },
              { value: 'Non Keluarga', label: 'Non Keluarga' }
            ]}
            style={{ minWidth: '150px' }}
          />
        </div>

        {/* Filter Petugas khusus Admin & Super Admin */}
        {isAdminOrSuperAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Petugas:</span>
            <CustomSelect 
              value={filterPetugas} 
              onChange={(val) => setFilterPetugas(val)}
              options={[
                { value: 'semua', label: 'Semua Petugas' },
                { value: 'unassigned', label: '⚠️ Belum Ditugaskan' },
                ...petugasList.map(p => ({ value: p.id, label: p.name }))
              ]}
              style={{ minWidth: '180px' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Urutkan:</span>
          <CustomSelect 
            value={sortBy} 
            onChange={(val) => setSortBy(val)}
            options={[
              { value: 'abjad-asc', label: 'Abjad (A-Z)' },
              { value: 'abjad-desc', label: 'Abjad (Z-A)' },
              { value: 'terbaru', label: 'Terbaru Ditambahkan' },
              { value: 'terlama', label: 'Terlama Ditambahkan' }
            ]}
            style={{ minWidth: '150px' }}
          />
        </div>
      </div>

      {/* Donatur List */}
      <div className="stagger">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Belum ada donatur</h3>
            <p>
              {isAdminOrSuperAdmin 
                ? 'Tidak ada data donatur yang sesuai dengan filter pencarian.' 
                : 'Belum ada donatur yang ditugaskan kepada Anda atau ditambahkan oleh Anda.'}
            </p>
          </div>
        ) : (
          filtered.map(d => {
            const isSelected = selectedIds.includes(d.id);
            const assignedPetugasName = d.petugasNama || (d.petugasId ? petugasMap[d.petugasId] : null);

            return (
              <div
                key={d.id}
                className="list-item"
                style={{
                  border: isBulkMode && isSelected ? '1.5px solid var(--primary)' : undefined,
                  background: isBulkMode && isSelected ? 'var(--primary-bg)' : undefined,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
                onClick={() => {
                  if (isBulkMode) {
                    handleToggleSelect(d.id);
                  } else {
                    router.push(`/pendataan/${d.id}`);
                  }
                }}
              >
                {/* Checkbox in bulk mode */}
                {isBulkMode && (
                  <div 
                    onClick={(e) => { e.stopPropagation(); handleToggleSelect(d.id); }}
                    style={{ flexShrink: 0 }}
                  >
                    {isSelected ? (
                      <CheckSquare size={20} color="var(--primary)" />
                    ) : (
                      <Square size={20} color="var(--text-tertiary)" />
                    )}
                  </div>
                )}

                <div className="list-item-content" style={{ flex: 1 }}>
                  <div className="list-item-title font-semibold" style={{ fontSize: '1rem' }}>
                    {d.nama}
                  </div>
                  
                  <div className="list-item-subtitle flex items-center gap-xs" style={{ marginTop: '2px' }}>
                    <MapPin size={12} />
                    <span>{d.kota || d.kabupaten || '-'}</span>
                    {d.noWa && <span>· WA: {d.noWa}</span>}
                  </div>

                  {/* Petugas Badge for Admin & Super Admin */}
                  {isAdminOrSuperAdmin && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} color="var(--text-tertiary)" />
                      {assignedPetugasName ? (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          Petugas: <strong style={{ color: 'var(--primary)' }}>{assignedPetugasName}</strong>
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 7px' }}>
                          Belum Ditugaskan
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="list-item-trailing" style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${d.kategori === 'Keluarga' ? 'badge-primary' : 'badge-neutral'}`}>
                    {d.kategori}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Donatur</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus data donatur <strong>{deleteConfirm.nama}</strong>?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { deleteDonatur(deleteConfirm.id); setDeleteConfirm(null); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* FAB (Mobile) */}
      {hasPermission(user, 'donatur.create') && (
        <button className="fab" onClick={() => router.push('/pendataan/tambah')} style={{ display: 'none' }}>
          <Plus size={24} />
        </button>
      )}

      <style jsx>{`
        @media (max-width: 1024px) {
          .fab { display: flex !important; }
          .page-header-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}
