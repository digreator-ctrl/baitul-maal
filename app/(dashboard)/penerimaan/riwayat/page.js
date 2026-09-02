'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/utils';
import { ArrowLeft, HandCoins, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function RiwayatPage() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, users } = useData();
  const router = useRouter();

  const riwayat = useMemo(() => {
    let list = donasi;
    if (user?.role === 'petugas') {
      list = list.filter(d => d.petugasId === user.id);
    }
    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, user]);

  const grouped = useMemo(() => {
    const groups = {};
    riwayat.forEach(d => {
      const month = new Date(d.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!groups[month]) groups[month] = [];
      groups[month].push(d);
    });
    return groups;
  }, [riwayat]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Riwayat Catatan</h1>
        <p>{riwayat.length} donasi tercatat</p>
      </div>

      {Object.entries(grouped).map(([month, items]) => (
        <div key={month} className="mb-lg">
          <div className="text-sm font-semibold text-secondary mb-md" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {month}
          </div>
          <div className="stagger">
            {items.map(dn => {
              const don = donatur.find(x => x.id === dn.donaturId);
              const kat = kategoriDonasi.find(k => k.id === dn.kategoriDonasiId);
              const met = metodeDonasi.find(m => m.id === dn.metodeDonasiId);
              const status = getStatusBadge(dn.status);
              const petugas = users.find(u => u.id === dn.petugasId);
              return (
                <div key={dn.id} className="list-item">
                  <div className="list-item-avatar" style={{
                    background: dn.status === 'ditolak' ? 'var(--danger-bg)' :
                      dn.status === 'terverifikasi' ? 'var(--success-bg)' :
                      dn.status === 'menunggu_verifikasi' ? 'var(--info-bg)' : 'var(--warning-bg)',
                    color: dn.status === 'ditolak' ? 'var(--danger)' :
                      dn.status === 'terverifikasi' ? 'var(--success)' :
                      dn.status === 'menunggu_verifikasi' ? 'var(--info)' : 'var(--warning)',
                  }}>
                    {dn.status === 'terverifikasi' ? <CheckCircle2 size={20} /> :
                     dn.status === 'ditolak' ? <XCircle size={20} /> :
                     dn.status === 'menunggu_verifikasi' ? <Clock size={20} /> :
                     <HandCoins size={20} />}
                  </div>
                  <div className="list-item-content">
                    <div className="list-item-title">{don?.nama || '-'}</div>
                    <div className="list-item-subtitle">{kat?.nama} · {met?.nama}</div>
                    <div className="list-item-subtitle">{formatTanggalShort(dn.tanggal)} {user?.role !== 'petugas' && petugas ? `· ${petugas.name}` : ''}</div>
                  </div>
                  <div className="list-item-trailing">
                    <div className="list-item-value">{formatRupiah(dn.nominal)}</div>
                    <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.625rem', marginTop: 4 }}>{status.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
