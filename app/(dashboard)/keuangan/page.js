'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { isReadOnly } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/utils';
import { Landmark, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export default function KeuanganPage() {
  const { user } = useAuth();
  const { setoran, metodeDonasi, users, pengeluaran } = useData();
  const router = useRouter();
  const [showRincian, setShowRincian] = useState(false);

  const readOnly = isReadOnly(user?.role);

  const sortedSetoran = useMemo(() => {
    return [...setoran].sort((a, b) => {
      // Pending first
      if (a.status === 'menunggu_verifikasi' && b.status !== 'menunggu_verifikasi') return -1;
      if (a.status !== 'menunggu_verifikasi' && b.status === 'menunggu_verifikasi') return 1;
      return new Date(b.tanggal) - new Date(a.tanggal);
    });
  }, [setoran]);

  // Hitung saldo yang telah diterima oleh Bendahara (hanya status terverifikasi) dikurangi pengeluaran
  const rekap = useMemo(() => {
    return metodeDonasi.filter(m => m.aktif).map(m => {
      const totalDiterima = setoran
        .filter(s => s.status === 'terverifikasi' && s.metodeDonasiId === m.id)
        .reduce((sum, s) => sum + s.totalNominal, 0);
      
      const totalKeluar = pengeluaran
        .filter(p => p.sumberDanaId === m.id)
        .reduce((sum, p) => sum + p.nominal, 0);

      return {
        ...m,
        saldoTersedia: Math.max(0, totalDiterima - totalKeluar)
      };
    });
  }, [metodeDonasi, setoran, pengeluaran]);

  const totalAkumulasi = rekap.reduce((sum, r) => sum + r.saldoTersedia, 0);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>Verifikasi Setoran</h1>
        <p>Kelola setoran dari petugas</p>
      </div>

      {/* Saldo Terkini */}
      <div 
        className="card mb-lg animate-scale" 
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => setShowRincian(!showRincian)}
      >
        {/* Dekorasi Card */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <h3 className="font-semibold mb-sm" style={{ opacity: 0.9 }}>Total Dana di Bendahara</h3>
            <div className="font-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>
              {formatRupiah(totalAkumulasi)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'white', background: 'rgba(255,255,255,0.2)' }}>
            {showRincian ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showRincian && (
          <div style={{ marginTop: '24px', animation: 'fadeIn 0.2s ease-in-out', position: 'relative', zIndex: 1 }}>
            <h4 className="font-semibold mb-sm" style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)', paddingBottom: '8px', opacity: 0.9 }}>
              Rincian Metode Penerimaan
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rekap.length > 0 ? (
                rekap.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                      <span style={{ opacity: 0.9 }}>{r.nama}</span>
                    </div>
                    <span className="font-medium text-lg" style={{ fontStyle: 'italic' }}>{formatRupiah(r.saldoTersedia)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm italic" style={{ padding: '8px 0', opacity: 0.8 }}>
                  Tidak ada metode donasi yang aktif.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Setoran List */}
      <h3 className="font-bold mb-md">Data Pengajuan Setoran</h3>
      <div className="stagger">
        {sortedSetoran.length === 0 ? (
          <div className="empty-state">
            <Landmark size={48} />
            <h3>Belum ada setoran</h3>
          </div>
        ) : (
          sortedSetoran.map(s => {
            const petugas = users.find(u => u.id === s.petugasId);
            const met = metodeDonasi.find(m => m.id === s.metodeDonasiId);
            const status = getStatusBadge(s.status);

            return (
              <div 
                key={s.id} 
                className="list-item" 
                style={{ display: 'block', padding: '16px', cursor: 'pointer', marginBottom: '12px' }}
                onClick={() => router.push(`/keuangan/${s.id}`)}
              >
                {/* Header (Date & Status) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="list-item-subtitle" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </div>
                  <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.75rem' }}>{status.label}</span>
                </div>
                
                {/* Body (Method/Name & Amount) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="list-item-title" style={{ fontSize: '1rem', marginBottom: '2px' }}>{met?.nama || 'Setoran'}</div>
                    <div className="list-item-subtitle" style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{petugas?.name || '-'}</div>
                  </div>
                  <div className="list-item-value" style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatRupiah(s.totalNominal)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
