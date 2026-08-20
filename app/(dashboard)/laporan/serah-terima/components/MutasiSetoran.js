'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { AlertTriangle, Clock } from 'lucide-react';

export function MutasiSetoran() {
  const { user } = useAuth();
  const { donasi, setoran, users } = useData();
  const [filterPetugas, setFilterPetugas] = useState('semua');

  if (!hasPermission(user, 'laporan.mutasi_setoran')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  // Get list of petugas users
  const petugasList = useMemo(() => {
    return users.filter(u => u.roles?.includes('petugas'));
  }, [users]);

  const summary = useMemo(() => {
    let targetPetugas = petugasList;
    if (isPetugas) {
      targetPetugas = petugasList.filter(p => p.id === user?.id);
    } else if (filterPetugas !== 'semua') {
      targetPetugas = petugasList.filter(p => p.id === filterPetugas);
    }

    return targetPetugas.map(petugas => {
      // Total tagihan (all donasi collected by this petugas)
      const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id);
      const totalTagihan = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);

      // Setoran by this petugas
      const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
      
      const totalDisetor = setoranPetugas
        .filter(s => s.status === 'terverifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const totalPending = setoranPetugas
        .filter(s => s.status === 'menunggu_verifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const totalDitolak = setoranPetugas
        .filter(s => s.status === 'ditolak')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const sisaMengendap = totalTagihan - totalDisetor - totalPending;

      return {
        petugas,
        totalTagihan,
        totalDisetor,
        totalPending,
        totalDitolak,
        sisaMengendap: Math.max(0, sisaMengendap),
        setoranDetail: setoranPetugas.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)),
        jumlahDonasi: donasiPetugas.length,
      };
    });
  }, [petugasList, donasi, setoran, isPetugas, user, filterPetugas]);

  const grandTotal = {
    tagihan: summary.reduce((s, r) => s + r.totalTagihan, 0),
    disetor: summary.reduce((s, r) => s + r.totalDisetor, 0),
    pending: summary.reduce((s, r) => s + r.totalPending, 0),
    mengendap: summary.reduce((s, r) => s + r.sisaMengendap, 0),
  };

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Filter (non-petugas only) */}
      {!isPetugas && (
        <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter Petugas</label>
            <select className="form-select" value={filterPetugas} onChange={(e) => setFilterPetugas(e.target.value)}>
              <option value="semua">Semua Petugas</option>
              {petugasList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Grand Total Cards */}
      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="text-sm text-secondary mb-xs">Total Tagihan</div>
          <div className="text-xl font-bold text-primary-color">{formatRupiah(grandTotal.tagihan)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="text-sm text-secondary mb-xs">Total Terverifikasi</div>
          <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>{formatRupiah(grandTotal.disetor)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="text-sm text-secondary mb-xs">Menunggu Verifikasi</div>
          <div className="text-xl font-bold" style={{ color: 'var(--info)' }}>{formatRupiah(grandTotal.pending)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="text-sm text-secondary mb-xs">Sisa Mengendap</div>
          <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>{formatRupiah(grandTotal.mengendap)}</div>
        </div>
      </div>

      {/* Per Petugas Cards */}
      <div className="stagger">
        {summary.map(row => (
          <div key={row.petugas.id} className="card mb-md">
            <div className="flex items-center gap-md mb-md" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div className="list-item-avatar" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                {row.petugas.avatar}
              </div>
              <div>
                <div className="font-bold text-md">{row.petugas.name}</div>
                <div className="text-sm text-secondary">{row.jumlahDonasi} donasi tercatat</div>
              </div>
            </div>

            {/* Mini stats */}
            <div className="grid gap-sm mb-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-secondary)' }}>
                <div className="text-xs text-tertiary">Tagihan</div>
                <div className="font-bold text-sm">{formatRupiah(row.totalTagihan)}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--success-bg)' }}>
                <div className="text-xs text-tertiary">Terverifikasi</div>
                <div className="font-bold text-sm" style={{ color: 'var(--success)' }}>{formatRupiah(row.totalDisetor)}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--info-bg)' }}>
                <div className="text-xs text-tertiary">Pending</div>
                <div className="font-bold text-sm" style={{ color: 'var(--info)' }}>{formatRupiah(row.totalPending)}</div>
              </div>
              <div style={{ padding: '8px 12px', borderRadius: '8px', background: row.sisaMengendap > 0 ? 'var(--warning-bg)' : 'var(--bg-secondary)' }}>
                <div className="text-xs text-tertiary flex items-center gap-xs">
                  Mengendap {row.sisaMengendap > 0 && <AlertTriangle size={10} color="var(--warning)" />}
                </div>
                <div className="font-bold text-sm" style={{ color: row.sisaMengendap > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                  {formatRupiah(row.sisaMengendap)}
                </div>
              </div>
            </div>

            {/* Setoran detail */}
            {row.setoranDetail.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-secondary mb-sm">Detail Setoran</div>
                {row.setoranDetail.map(s => {
                  const status = getStatusBadge(s.status);
                  return (
                    <div key={s.id} className="list-item" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <div className="list-item-content">
                        <div className="list-item-title text-sm">{s.keterangan || 'Setoran'}</div>
                        <div className="list-item-subtitle">{formatTanggalShort(s.tanggal)}</div>
                      </div>
                      <div className="list-item-trailing text-right">
                        <div className="font-bold text-sm">{formatRupiah(s.totalNominal)}</div>
                        <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.7rem' }}>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {summary.length === 0 && (
          <div className="empty-state">
            <Clock size={48} />
            <h3>Tidak Ada Data</h3>
            <p>Tidak ada data petugas yang tersedia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
