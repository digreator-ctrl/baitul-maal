'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission, isReadOnly } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import { HandCoins, Plus, Search, Calendar, Filter } from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';

export default function PenerimaanPage() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, addDonasi, showToast } = useData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSortFocused, setIsSortFocused] = useState(false);
  const [form, setForm] = useState({
    donaturId: '', tanggal: new Date().toISOString().split('T')[0],
    kategoriDonasiId: '', metodeDonasiId: '', nominal: '',
  });
  const [errors, setErrors] = useState({});

  // Helper for nominal formatting
  const handleNominalChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, nominal: value }));
  };

  const formatNominalDisplay = (val) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.tanggal) newErrors.tanggal = true;
    if (!form.donaturId) newErrors.donaturId = true;
    if (!form.kategoriDonasiId) newErrors.kategoriDonasiId = true;
    if (!form.metodeDonasiId) newErrors.metodeDonasiId = true;
    if (!form.nominal) newErrors.nominal = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Mohon lengkapi semua kolom yang wajib diisi', 'danger');
      return;
    }

    addDonasi({ ...form, nominal: parseInt(form.nominal), petugasId: user?.id });
    setForm({ donaturId: '', tanggal: new Date().toISOString().split('T')[0], kategoriDonasiId: '', metodeDonasiId: '', nominal: '' });
    setErrors({});
    setShowForm(false);
  };

  // Show only petugas's own donasi, or all for admin/pengawas
  const filteredDonasi = useMemo(() => {
    let list = donasi;
    if (user?.role === 'petugas') {
      list = list.filter(d => d.petugasId === user.id);
    }
    if (search) {
      list = list.filter(d => {
        const don = donatur.find(x => x.id === d.donaturId);
        return don?.nama.toLowerCase().includes(search.toLowerCase());
      });
    }

    let sorted = [...list];
    if (sortBy === 'terbaru') {
      sorted.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    } else if (sortBy === 'terlama') {
      sorted.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    } else if (sortBy === 'a-z' || sortBy === 'z-a') {
      sorted.sort((a, b) => {
        const donA = donatur.find(x => x.id === a.donaturId)?.nama || '';
        const donB = donatur.find(x => x.id === b.donaturId)?.nama || '';
        return sortBy === 'a-z' ? donA.localeCompare(donB) : donB.localeCompare(donA);
      });
    }
    return sorted;
  }, [donasi, user, search, donatur, sortBy]);

  const readOnly = isReadOnly(user?.role);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Penerimaan Donasi</h1>
            <p style={{ marginTop: '8px' }}>Catat donasi dari donatur</p>
          </div>
          {hasPermission(user, 'donasi.create') && (
            <div className="page-header-actions flex gap-xs flex-wrap">
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={18} /> Tambah Donasi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {!readOnly && (
        <div className="flex flex-wrap gap-sm mb-lg">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/penerimaan/riwayat')}>
            <Calendar size={16} /> Riwayat
          </button>
          {hasPermission(user, 'donasi.setor') && (
            <button className="btn btn-secondary btn-sm" onClick={() => router.push('/penerimaan/setor')}>
              <HandCoins size={16} /> Setor ke Bendahara
            </button>
          )}
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex gap-sm mb-md" style={{ flexWrap: 'nowrap', transition: 'all 0.3s' }}>
        {!isSortFocused && (
          <div className="search-bar" style={{ flex: isSearchFocused ? '1 1 100%' : '1 1 50%', marginBottom: 0 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Cari donatur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
          </div>
        )}
        {!isSearchFocused && (
          <select
            className="form-select"
            style={{ flex: isSortFocused ? '1 1 100%' : '1 1 50%', width: 'auto' }}
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            onFocus={() => setIsSortFocused(true)}
            onBlur={() => setIsSortFocused(false)}
          >
            <option value="terbaru">Terbaru</option>
            <option value="terlama">Terlama</option>
            <option value="a-z">A - Z (Nama)</option>
            <option value="z-a">Z - A (Nama)</option>
          </select>
        )}
      </div>

      {/* Donasi List */}
      <div className="stagger">
        {filteredDonasi.length === 0 ? (
          <div className="empty-state">
            <HandCoins size={48} />
            <h3>Belum ada donasi</h3>
            <p>Mulai catat donasi dengan menekan tombol di atas.</p>
          </div>
        ) : (
          filteredDonasi.map(dn => {
            const don = donatur.find(x => x.id === dn.donaturId);
            const kat = kategoriDonasi.find(k => k.id === dn.kategoriDonasiId);
            const met = metodeDonasi.find(m => m.id === dn.metodeDonasiId);
            return (
              <div key={dn.id} className="list-item" style={{ display: 'block', padding: '16px', cursor: 'pointer' }} onClick={() => router.push(`/penerimaan/${dn.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="list-item-subtitle">
                    {new Date(dn.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </div>
                  <div
                    title={dn.laporanTerkirim ? "Laporan WA Terkirim" : "Laporan WA Belum Terkirim"}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: dn.laporanTerkirim ? 'var(--success)' : 'var(--warning)',
                      boxShadow: dn.laporanTerkirim ? '0 0 8px var(--success-bg)' : '0 0 8px var(--warning-bg)'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div className="list-item-title" style={{ fontSize: '1rem' }}>{don?.nama || 'Donatur'}</div>
                  <div className="list-item-value" style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatRupiah(dn.nominal)}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="list-item-subtitle">{kat?.nama}</div>
                  <div className="list-item-subtitle">{met?.nama}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Donasi Baru</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* 1. Tanggal */}
                <div className="form-group">
                  <label className="form-label">Tanggal *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.tanggal}
                    onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))}
                    onClick={(e) => e.target.showPicker()}
                    style={{ borderColor: errors.tanggal ? 'var(--danger)' : undefined }}
                  />
                </div>

                {/* 2. Donatur */}
                <div className="form-group">
                  <label className="form-label">Donatur *</label>
                  <SearchableSelect
                    options={donatur.map(d => ({ value: d.id, label: d.nama })).sort((a, b) => a.label.localeCompare(b.label))}
                    value={form.donaturId}
                    onChange={(val) => setForm(prev => ({ ...prev, donaturId: val }))}
                    placeholder="Pilih Donatur..."
                    error={errors.donaturId}
                  />
                </div>

                {/* 3. Kategori Donasi */}
                <div className="form-group">
                  <label className="form-label">Kategori Donasi *</label>
                  <select
                    className="form-select"
                    value={form.kategoriDonasiId}
                    onChange={(e) => setForm(prev => ({ ...prev, kategoriDonasiId: e.target.value }))}
                    style={{ borderColor: errors.kategoriDonasiId ? 'var(--danger)' : undefined }}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriDonasi.filter(k => k.aktif).map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Metode Donasi */}
                <div className="form-group">
                  <label className="form-label">Metode Donasi *</label>
                  <select
                    className="form-select"
                    value={form.metodeDonasiId}
                    onChange={(e) => setForm(prev => ({ ...prev, metodeDonasiId: e.target.value }))}
                    style={{ borderColor: errors.metodeDonasiId ? 'var(--danger)' : undefined }}
                  >
                    <option value="">-- Pilih Metode --</option>
                    {metodeDonasi.filter(m => m.aktif).map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Nominal */}
                <div className="form-group">
                  <label className="form-label">Nominal (Rp) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0"
                    value={formatNominalDisplay(form.nominal)}
                    onChange={handleNominalChange}
                    style={{ borderColor: errors.nominal ? 'var(--danger)' : undefined }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  <HandCoins size={16} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      {hasPermission(user, 'donasi.create') && (
        <button className="fab" onClick={() => setShowForm(true)} style={{ display: 'none' }}>
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
