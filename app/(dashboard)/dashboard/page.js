'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import {
  Wallet, TrendingUp, TrendingDown, Users, HandCoins, 
  Clock, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { donasi, donatur, setoran, pengeluaran, metodeDonasi, users, getSaldoPerMetode } = useData();

  const stats = useMemo(() => {
    const totalDonasiVerified = donasi
      .filter(d => d.status === 'terverifikasi')
      .reduce((sum, d) => sum + d.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((sum, p) => sum + p.nominal, 0);
    const saldo = getSaldoPerMetode();
    const totalSaldo = Object.values(saldo).reduce((sum, s) => sum + s, 0);
    const totalDonatur = donatur.length;
    const pendingSetoran = setoran.filter(s => s.status === 'menunggu_verifikasi').length;
    const donasiBlmSetor = donasi.filter(d => d.status === 'belum_disetor').length;
    const ditolak = donasi.filter(d => d.status === 'ditolak').length;

    // Per petugas stats
    const petugasStats = users
      .filter(u => u.role === 'petugas')
      .map(u => {
        const petugasDonasi = donasi.filter(d => d.petugasId === u.id);
        const total = petugasDonasi.reduce((sum, d) => sum + d.nominal, 0);
        const count = petugasDonasi.length;
        const belumSetor = petugasDonasi.filter(d => d.status === 'belum_disetor').length;
        return { ...u, totalDonasi: total, jumlahDonasi: count, belumSetor };
      });

    return {
      totalDonasiVerified, totalPengeluaran, totalSaldo, totalDonatur,
      pendingSetoran, donasiBlmSetor, ditolak, petugasStats, saldo,
    };
  }, [donasi, donatur, setoran, pengeluaran, users, getSaldoPerMetode]);

  // Recent verified/rejected items for status panel
  const recentStatusItems = useMemo(() => {
    return setoran
      .filter(s => s.status !== 'menunggu_verifikasi' || s.status === 'menunggu_verifikasi')
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 5)
      .map(s => {
        const petugas = users.find(u => u.id === s.petugasId);
        return { ...s, petugasName: petugas?.name || '-' };
      });
  }, [setoran, users]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Assalamu&apos;alaikum, {user?.name}! 👋</p>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid stagger">
        {hasPermission(user, 'dashboard.kas') && (
          <>
            <div className="stat-card">
              <div className="stat-icon green"><Wallet size={22} /></div>
              <div className="stat-label">Total Saldo</div>
              <div className="stat-value">{formatRupiah(stats.totalSaldo)}</div>
              <div className="stat-change text-success">
                <TrendingUp size={12} /> Dari {Object.keys(stats.saldo).length} metode
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><TrendingUp size={22} /></div>
              <div className="stat-label">Donasi Terverifikasi</div>
              <div className="stat-value">{formatRupiah(stats.totalDonasiVerified)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><TrendingDown size={22} /></div>
              <div className="stat-label">Total Pengeluaran</div>
              <div className="stat-value">{formatRupiah(stats.totalPengeluaran)}</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <div className="stat-icon gold"><Users size={22} /></div>
          <div className="stat-label">Total Donatur</div>
          <div className="stat-value">{stats.totalDonatur}</div>
        </div>
      </div>

      {/* Alert Cards */}
      {(stats.pendingSetoran > 0 || stats.ditolak > 0) && (
        <div className="flex flex-wrap gap-md mt-lg">
          {stats.pendingSetoran > 0 && hasPermission(user, 'keuangan.verifikasi') && (
            <div className="card flex items-center gap-md" style={{ borderLeft: '3px solid var(--warning)', flex: '1 1 280px' }}>
              <Clock size={24} color="var(--warning)" />
              <div>
                <div className="font-semibold">{stats.pendingSetoran} setoran menunggu verifikasi</div>
                <div className="text-sm text-secondary">Perlu tindakan dari bendahara</div>
              </div>
            </div>
          )}
          {stats.ditolak > 0 && (
            <div className="card flex items-center gap-md" style={{ borderLeft: '3px solid var(--danger)', flex: '1 1 280px' }}>
              <XCircle size={24} color="var(--danger)" />
              <div>
                <div className="font-semibold">{stats.ditolak} donasi ditolak</div>
                <div className="text-sm text-secondary">Periksa catatan penolakan</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Verifikasi Panel */}
      {recentStatusItems.length > 0 && (
        <div className="status-panel mt-lg">
          <div className="status-panel-header">
            <h3 className="flex items-center gap-sm">
              <AlertCircle size={16} />
              Status Setoran Terkini
            </h3>
          </div>
          {recentStatusItems.map(item => {
            const status = getStatusBadge(item.status);
            return (
              <div key={item.id} className={`status-panel-item ${item.status === 'ditolak' ? 'rejected' : item.status === 'terverifikasi' ? 'verified' : 'pending'}`}>
                <div style={{ flex: 1 }}>
                  <div className="font-semibold text-sm">{item.petugasName}</div>
                  <div className="text-sm text-secondary">{formatTanggalShort(item.tanggal)} · {formatRupiah(item.totalNominal)}</div>
                  {item.catatan && <div className="text-sm text-tertiary mt-sm">Catatan: {item.catatan}</div>}
                </div>
                <span className={`badge badge-${status.variant}`}>
                  {item.status === 'terverifikasi' && <CheckCircle2 size={12} />}
                  {item.status === 'ditolak' && <XCircle size={12} />}
                  {item.status === 'menunggu_verifikasi' && <Clock size={12} />}
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Kinerja Petugas */}
      {hasPermission(user, 'dashboard.kinerja') && (
        <div className="mt-lg">
          <h3 className="font-semibold mb-md flex items-center gap-sm">
            <HandCoins size={18} />
            Kinerja Petugas
          </h3>
          <div className="stagger">
            {stats.petugasStats.map(p => (
              <div key={p.id} className="list-item">
                <div className="list-item-avatar">{p.avatar}</div>
                <div className="list-item-content">
                  <div className="list-item-title">{p.name}</div>
                  <div className="list-item-subtitle">{p.jumlahDonasi} donasi dicatat</div>
                </div>
                <div className="list-item-trailing">
                  <div className="list-item-value">{formatRupiah(p.totalDonasi)}</div>
                  {p.belumSetor > 0 && (
                    <div className="list-item-meta">
                      <span className="badge badge-warning" style={{ fontSize: '0.6875rem' }}>
                        {p.belumSetor} belum setor
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saldo per Metode */}
      {hasPermission(user, 'dashboard.kas') && (
        <div className="mt-lg">
          <h3 className="font-semibold mb-md flex items-center gap-sm">
            <Wallet size={18} />
            Saldo per Metode Donasi
          </h3>
          <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {metodeDonasi.filter(m => m.aktif).map(m => {
              const saldo = stats.saldo[m.id] || 0;
              return (
                <div key={m.id} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="text-sm text-secondary mb-sm">{m.nama}</div>
                  <div className="font-bold" style={{ color: saldo > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                    {formatRupiah(saldo)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
