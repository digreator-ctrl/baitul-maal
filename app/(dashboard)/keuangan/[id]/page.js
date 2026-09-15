'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggal, getStatusBadge } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { ArrowLeft, CheckCircle2, Clock, XCircle, HandCoins, Calendar, Wallet, FileText, User } from 'lucide-react';

export default function DetailVerifikasiSetoranPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const { setoran, metodeDonasi, users, verifikasiSetoran } = useData();
  const [data, setData] = useState(null);

  const [showReject, setShowReject] = useState(false);
  const [catatan, setCatatan] = useState('');


  useEffect(() => {
    const found = setoran.find(s => s.id === id);
    if (found) setData(found);
  }, [id, setoran]);

  if (!data) return <div className="p-lg text-center">Memuat data setoran...</div>;

  const met = metodeDonasi.find(m => m.id === data.metodeDonasiId);
  const petugas = users.find(u => u.id === data.petugasId);
  const bendahara = data.verifikasiOleh ? users.find(u => u.id === data.verifikasiOleh) : null;
  const status = getStatusBadge(data.status);

  const handleVerifikasi = () => {
    verifikasiSetoran(id, user?.id, true);
  };

  const handleTolak = () => {
    verifikasiSetoran(id, user?.id, false, catatan);
    setShowReject(false);
    setCatatan('');
  };

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Detail Setoran</h1>
            <p style={{ marginTop: '8px' }}>Rincian pengajuan setoran dana donasi.</p>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 0', borderBottom: '1px dashed var(--border)' }}>
          <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.875rem', padding: '6px 12px', marginBottom: '16px' }}>
            {status.label}
          </span>
          <h2 className="font-bold text-primary" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {formatRupiah(data.totalNominal)}
          </h2>
          <p className="text-secondary font-medium" style={{ fontSize: '1.1rem' }}>{met?.nama || 'Metode Donasi'}</p>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informasi Pengajuan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Calendar size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Tanggal Pengajuan</div>
                <div className="font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <User size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Diajukan Oleh (Petugas)</div>
                <div className="font-medium">{petugas?.name || '-'}</div>
              </div>
            </div>

            {data.keterangan && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <FileText size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Keterangan Petugas</div>
                  <div className="font-medium">{data.keterangan}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {(data.status === 'terverifikasi' || data.status === 'ditolak') && (
          <div style={{ padding: '0 24px 24px 24px' }}>
            <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informasi Verifikasi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <User size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Diverifikasi Oleh</div>
                  <div className="font-medium">{bendahara?.name || '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Calendar size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Tanggal Verifikasi</div>
                  <div className="font-medium">{data.tanggalVerifikasi ? new Date(data.tanggalVerifikasi).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}</div>
                </div>
              </div>

              {data.catatan && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <FileText size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                  <div>
                    <div className="text-sm text-secondary">Catatan Bendahara</div>
                    <div className="font-medium">{data.catatan}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {data.status === 'menunggu_verifikasi' && hasPermission(user, 'keuangan.verifikasi') && (
          <div style={{ padding: '0 24px 24px 24px' }}>
            <div className="flex gap-sm mt-md">
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleVerifikasi}>
                <CheckCircle2 size={18} /> Verifikasi Setoran
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowReject(true)}>
                <XCircle size={18} /> Tolak Setoran
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showReject && (
        <div className="modal-overlay" onClick={() => { setShowReject(false); setCatatan(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tolak Setoran</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => { setShowReject(false); setCatatan(''); }}>✕</button>
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
              <button className="btn btn-secondary" onClick={() => { setShowReject(false); setCatatan(''); }}>Batal</button>
              <button className="btn btn-danger" onClick={handleTolak}>
                <XCircle size={16} /> Tolak Setoran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
