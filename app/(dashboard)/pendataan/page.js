'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { formatTanggalShort } from '@/lib/mock';
import { Users, Plus, Search, MapPin, Phone, Filter } from 'lucide-react';

export default function PendataanPage() {
  const { user } = useAuth();
  const { donatur, donasi, deleteDonatur } = useData();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    return donatur.filter(d => {
      const matchSearch = d.nama.toLowerCase().includes(search.toLowerCase()) ||
        d.noWa.includes(search) ||
        d.kota.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'semua' || d.kategori === filterKategori;
      return matchSearch && matchKategori;
    });
  }, [donatur, search, filterKategori]);

  const getDonaturDonasiCount = (donaturId) => {
    return donasi.filter(d => d.donaturId === donaturId).length;
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Pendataan Donatur</h1>
          </div>
          {hasPermission(user, 'donatur.create') && (
            <div className="page-header-actions flex gap-xs flex-wrap">
              <button className="btn btn-primary" onClick={() => router.push('/pendataan/tambah')}>
                <Plus size={18} /> Tambah Donatur
              </button>
            </div>
          )}
        </div>
      </div>

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

      <div className="filter-bar">
        {['semua', 'Keluarga', 'Non Keluarga'].map(k => (
          <button
            key={k}
            className={`filter-chip ${filterKategori === k ? 'active' : ''}`}
            onClick={() => setFilterKategori(k)}
          >
            {k === 'semua' ? 'Semua' : k}
          </button>
        ))}
      </div>

      {/* Donatur List */}
      <div className="stagger">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>Belum ada donatur</h3>
            <p>Mulai tambahkan data donatur dengan menekan tombol di atas.</p>
          </div>
        ) : (
          filtered.map(d => (
            <div
              key={d.id}
              className="list-item"
              onClick={() => router.push(`/pendataan/${d.id}`)}
            >
              <div className="list-item-content">
                <div className="list-item-title">{d.nama}</div>
                <div className="list-item-subtitle flex items-center gap-xs">
                  <MapPin size={12} />
                  {d.kota}
                </div>
              </div>
              <div className="list-item-trailing">
                <span className={`badge ${d.kategori === 'Keluarga' ? 'badge-primary' : 'badge-neutral'}`}>
                  {d.kategori}
                </span>
              </div>
            </div>
          ))
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
