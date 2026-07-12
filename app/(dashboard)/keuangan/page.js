'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { isReadOnly } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { Landmark, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react';

export default function KeuanganPage() {
  const { user } = useAuth();
  const { setoran, donasi, donatur, kategoriDonasi, metodeDonasi, users, verifikasiSetoran } = useData();
  const [expandedSetoran, setExpandedSetoran] = useState(null);
  const [showReject, setShowReject] = useState(null);
  const [catatan, setCatatan] = useState('');

  const readOnly = isReadOnly(user?.role);

  const sortedSetoran = useMemo(() => {
    return [...setoran].sort((a, b) => {
      // Pending first
      if (a.status === 'menunggu_verifikasi' && b.status !== 'menunggu_verifikasi') return -1;
      if (a.status !== 'menunggu_verifikasi' && b.status === 'menunggu_verifikasi') return 1;
      return new Date(b.tanggal) - new Date(a.tanggal);
    });
  }, [setoran]);

  const handleVerifikasi = (setoranId) => {
    verifikasiSetoran(setoranId, user?.id, true);
  };

  const handleTolak = (setoranId) => {
    verifikasiSetoran(setoranId, user?.id, false, catatan);
    setShowReject(null);
    setCatatan('');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>Verifikasi Setoran</h1>
        <p>Kelola setoran dari petugas</p>
      </div>

      {/* Summary */}
      <div className="stats-grid mb-lg" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon gold"><Clock size={22} /></div>
          <div className="stat-label">Menunggu</div>
          <div className="stat-value">{setoran.filter(s => s.status === 'menunggu_verifikasi').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-label">Terverifikasi</div>
          <div className="stat-value">{setoran.filter(s => s.status === 'terverifikasi').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><XCircle size={22} /></div>
          <div className="stat-label">Ditolak</div>
          <div className="stat-value">{setoran.filter(s => s.status === 'ditolak').length}</div>
        </div>
      </div>

      {/* Setoran List */}
      <div className="stagger">
        {sortedSetoran.length === 0 ? (
          <div className="empty-state">
            <Landmark size={48} />
            <h3>Belum ada setoran</h3>
          </div>
        ) : (
          sortedSetoran.map(s => {
            const petugas = users.find(u => u.id === s.petugasId);
            const verifikator = users.find(u => u.id === s.verifikasiOleh);
            const isExpanded = expandedSetoran === s.id;
            const statusColor = s.status === 'terverifikasi' ? 'success' : s.status === 'ditolak' ? 'danger' : 'warning';

            return (
              <div key={s.id} className="card" style={{ padding: 0, borderLeft: `3px solid var(--${statusColor})` }}>
                {/* Header */}
                <div
                  className="flex items-center gap-md p-md"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setExpandedSetoran(isExpanded ? null : s.id)}
                >
                  <div className="list-item-avatar" style={{
                    background: `var(--${statusColor}-bg)`,
                    color: `var(--${statusColor})`,
                  }}>
                    {s.status === 'terverifikasi' ? <CheckCircle2 size={20} /> :
                     s.status === 'ditolak' ? <XCircle size={20} /> :
                     <Clock size={20} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-semibold text-sm">{petugas?.name || '-'}</div>
                    <div className="text-sm text-secondary">{formatTanggalShort(s.tanggal)} · {metodeDonasi.find(m => m.id === s.metodeDonasiId)?.nama || '-'}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary-color">{formatRupiah(s.totalNominal)}</div>
                    {isExpanded ? <ChevronUp size={16} color="var(--text-tertiary)" /> : <ChevronDown size={16} color="var(--text-tertiary)" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-md)' }}>
                    
                    {s.keterangan && (
                      <div className="text-sm mb-md" style={{ color: 'var(--text-secondary)' }}>
                        <strong>Keterangan:</strong> {s.keterangan}
                      </div>
                    )}

                    {s.catatan && (
                      <div className="mt-md" style={{ padding: '8px 12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem' }}>
                        <strong>Catatan:</strong> {s.catatan}
                      </div>
                    )}

                    {s.verifikasiOleh && (
                      <div className="text-sm text-tertiary mt-md">
                        {s.status === 'terverifikasi' ? 'Diverifikasi' : 'Ditolak'} oleh {verifikator?.name} pada {formatTanggalShort(s.tanggalVerifikasi)}
                      </div>
                    )}

                    {/* Action Buttons */}
                    {s.status === 'menunggu_verifikasi' && !readOnly && (
                      <div className="flex gap-sm mt-md">
                        <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => handleVerifikasi(s.id)}>
                          <CheckCircle2 size={16} /> Verifikasi
                        </button>
                        <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => setShowReject(s.id)}>
                          <XCircle size={16} /> Tolak
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="modal-overlay" onClick={() => { setShowReject(null); setCatatan(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Setoran</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowReject(null); setCatatan(''); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Alasan Penolakan</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tuliskan alasan penolakan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowReject(null); setCatatan(''); }}>Batal</button>
              <button className="btn btn-danger" onClick={() => handleTolak(showReject)}>
                <XCircle size={16} /> Tolak Setoran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
