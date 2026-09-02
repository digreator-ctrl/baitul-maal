'use client';

import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, MapPin, Phone, ExternalLink, HandCoins } from 'lucide-react';
import { useState } from 'react';

export default function DetailDonaturPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { donatur, donasi, kategoriDonasi, metodeDonasi, deleteDonatur } = useData();
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const d = donatur.find(x => x.id === id);
  const donasiList = useMemo(() =>
    donasi.filter(x => x.donaturId === id).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)),
    [donasi, id]
  );

  if (!d) {
    return (
      <div className="animate-fade-in-up">
        <button className="btn btn-ghost mb-md" onClick={() => router.back()}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="empty-state">
          <h3>Donatur tidak ditemukan</h3>
        </div>
      </div>
    );
  }

  const totalDonasi = donasiList.reduce((sum, x) => sum + x.nominal, 0);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1>{d.nama}</h1>
            <p>{d.kategori}</p>
          </div>
          <div className="flex gap-xs">
            {hasPermission(user, 'donatur.edit') && (
              <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/pendataan/${id}/edit`)}>
                <Edit size={14} /> Edit
              </button>
            )}
            {hasPermission(user, 'donatur.delete') && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-md mb-lg" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('info')}
          style={{ 
            padding: '8px 16px', 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'info' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'info' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'info' ? '600' : 'normal',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Info Personal
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')}
          style={{ 
            padding: '8px 16px', 
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'riwayat' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'riwayat' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'riwayat' ? '600' : 'normal',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Riwayat Donasi
        </button>
      </div>

      {/* Tab Content: Info Personal */}
      {activeTab === 'info' && (
        <div className="animate-fade-in">
          {/* Info Card */}
          <div className="card mb-md">
            <div className="flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <MapPin size={16} color="var(--text-secondary)" />
                <div>
                  <div className="text-sm">{d.kelurahan}, {d.kecamatan}</div>
                  <div className="text-sm text-secondary">{d.kota}, {d.provinsi}</div>
                  {d.keterangan && <div className="text-sm text-tertiary">{d.keterangan}</div>}
                </div>
              </div>
              <div className="flex items-center gap-sm">
                <Phone size={16} color="var(--text-secondary)" />
                <a href={`https://wa.me/${d.noWa?.replace(/^0/, '62')}`} target="_blank" rel="noopener noreferrer" className="text-sm">
                  {d.noWa}
                </a>
              </div>
              {d.linkGmaps && (
                <div className="flex items-center gap-sm">
                  <ExternalLink size={16} color="var(--text-secondary)" />
                  <a href={d.linkGmaps} target="_blank" rel="noopener noreferrer" className="text-sm">
                    Lihat di Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="card mb-lg">
            <h3 className="font-semibold mb-md">Ringkasan Donasi</h3>
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm text-secondary mb-xs">Total Donasi</div>
                <div className="font-bold" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>{formatRupiah(totalDonasi)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="text-sm text-secondary mb-xs">Jumlah Donasi</div>
                <div className="font-bold" style={{ fontSize: '1.25rem' }}>{donasiList.length} Kali</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Riwayat Donasi */}
      {activeTab === 'riwayat' && (
        <div className="animate-fade-in">
          {donasiList.length === 0 ? (
            <div className="empty-state">
              <HandCoins size={48} />
              <h3>Belum ada donasi</h3>
              <p>Donatur ini belum pernah berdonasi.</p>
            </div>
          ) : (
            <div className="stagger">
              {donasiList.map(dn => {
                const kat = kategoriDonasi.find(k => k.id === dn.kategoriDonasiId);
                const met = metodeDonasi.find(m => m.id === dn.metodeDonasiId);
                const formattedDate = new Date(dn.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
                return (
                  <div key={dn.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                    <div className="list-item-content">
                      <div className="list-item-title">{kat?.nama || '-'}</div>
                      <div className="list-item-subtitle" style={{ marginTop: '4px' }}>{formattedDate}</div>
                    </div>
                    <div className="list-item-trailing" style={{ textAlign: 'right' }}>
                      <div className="list-item-value" style={{ color: 'var(--primary)' }}>{formatRupiah(dn.nominal)}</div>
                      <div className="list-item-subtitle" style={{ marginTop: '4px' }}>{met?.nama}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hapus Donatur</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDelete(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Yakin ingin menghapus donatur <strong>{d.nama}</strong>? Data donasi terkait tidak akan dihapus.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Batal</button>
              <button className="btn btn-danger" onClick={() => { deleteDonatur(d.id); router.push('/pendataan'); }}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
