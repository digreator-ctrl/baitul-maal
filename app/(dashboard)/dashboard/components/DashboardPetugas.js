'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import {
  Wallet, HandCoins, Users, Clock, AlertTriangle, CheckCircle2,
  XCircle, PlusCircle, Send, UserPlus, ChevronRight, FileText, ArrowUpRight
} from 'lucide-react';

export function DashboardPetugas() {
  const { user } = useAuth();
  const { donasi, donatur, setoran, kategoriDonasi } = useData();

  const stats = useMemo(() => {
    if (!user) return null;

    const donasiSaya = donasi.filter(d => d.petugasId === user.id);
    const setoranSaya = setoran.filter(s => s.petugasId === user.id);

    const totalTerkumpulSemua = donasiSaya.reduce((sum, d) => sum + d.nominal, 0);
    const totalDisetorVerified = setoranSaya
      .filter(s => s.status === 'terverifikasi')
      .reduce((sum, s) => sum + s.totalNominal, 0);
    const totalSetoranPending = setoranSaya
      .filter(s => s.status === 'menunggu_verifikasi')
      .reduce((sum, s) => sum + s.totalNominal, 0);

    // Saldo mengendap di tangan = total terkumpul - total terverifikasi - total pending
    const danaMengendap = Math.max(0, totalTerkumpulSemua - totalDisetorVerified - totalSetoranPending);

    // Donasi bulan ini
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const donasiBulanIni = donasiSaya.filter(d => {
      const dt = new Date(d.tanggal);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    });
    const nominalBulanIni = donasiBulanIni.reduce((sum, d) => sum + d.nominal, 0);

    // Setoran ditolak
    const listDitolak = setoranSaya.filter(s => s.status === 'ditolak');

    // Total donatur yang pernah ditransaksikan oleh petugas ini
    const donaturIdSet = new Set(donasiSaya.map(d => d.donaturId));
    const totalDonaturDilayani = donaturIdSet.size;

    // 5 donasi terakhir
    const riwayatDonasi = [...donasiSaya]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 5)
      .map(d => {
        const dnr = donatur.find(x => x.id === d.donaturId);
        const kat = kategoriDonasi.find(k => k.id === d.kategoriId);
        return {
          ...d,
          donaturName: dnr?.nama || 'Hamba Allah',
          kategoriName: kat?.nama || 'Umum',
        };
      });

    // 4 setoran terakhir
    const riwayatSetoran = [...setoranSaya]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 4);

    return {
      danaMengendap,
      totalSetoranPending,
      nominalBulanIni,
      jumlahDonasiBulanIni: donasiBulanIni.length,
      totalDonaturDilayani,
      listDitolak,
      riwayatDonasi,
      riwayatSetoran,
    };
  }, [user, donasi, donatur, setoran, kategoriDonasi]);

  if (!stats) return null;

  return (
    <div className="animate-fade-in-up">
      {/* Alert Setoran Ditolak */}
      {stats.listDitolak.length > 0 && (
        <div className="card mb-lg" style={{ borderLeft: '4px solid var(--danger)', background: 'var(--danger-bg)' }}>
          <div className="flex items-start gap-md">
            <XCircle size={24} color="var(--danger)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1 }}>
              <div className="font-bold text-md" style={{ color: 'var(--danger)' }}>
                Perhatian: Ada {stats.listDitolak.length} Setoran Anda yang Ditolak Bendahara!
              </div>
              <p className="text-sm mt-xs text-secondary">
                Harap periksa catatan verifikasi bendahara dan ajukan ulang setoran jika diperlukan.
              </p>
              <div className="mt-sm" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.listDitolak.map(s => (
                  <div key={s.id} className="card" style={{ padding: '10px 14px', background: 'var(--bg-card)' }}>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">{formatTanggalShort(s.tanggal)} · {formatRupiah(s.totalNominal)}</span>
                      <span className="badge badge-danger">Ditolak</span>
                    </div>
                    {s.catatan && (
                      <div className="text-xs text-tertiary mt-xs">
                        <strong>Alasan Bendahara:</strong> &ldquo;{s.catatan}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="stats-grid stagger mb-lg">
        {/* Dana Mengendap (Prioritas Petugas) */}
        <div className="stat-card" style={{ borderTop: stats.danaMengendap > 0 ? '3px solid var(--warning)' : '3px solid var(--success)' }}>
          <div className="stat-icon" style={{ background: stats.danaMengendap > 0 ? 'var(--warning-bg)' : 'var(--success-bg)', color: stats.danaMengendap > 0 ? 'var(--warning)' : 'var(--success)' }}>
            <Wallet size={22} />
          </div>
          <div className="stat-label">Dana di Tangan (Belum Disetor)</div>
          <div className="stat-value" style={{ color: stats.danaMengendap > 0 ? 'var(--warning)' : 'var(--success)' }}>
            {formatRupiah(stats.danaMengendap)}
          </div>
          <div className="stat-change text-secondary">
            {stats.danaMengendap > 0 ? (
              <span className="flex items-center gap-xs" style={{ color: 'var(--warning)' }}>
                <AlertTriangle size={12} /> Segera setor ke bendahara
              </span>
            ) : (
              <span className="flex items-center gap-xs" style={{ color: 'var(--success)' }}>
                <CheckCircle2 size={12} /> Semua dana telah disetor
              </span>
            )}
          </div>
        </div>

        {/* Setoran Menunggu Verifikasi */}
        <div className="stat-card">
          <div className="stat-icon blue"><Clock size={22} /></div>
          <div className="stat-label">Setoran Pending Verifikasi</div>
          <div className="stat-value">{formatRupiah(stats.totalSetoranPending)}</div>
          <div className="stat-change text-secondary">Sedang ditinjau bendahara</div>
        </div>

        {/* Donasi Terkumpul Bulan Ini */}
        <div className="stat-card">
          <div className="stat-icon green"><HandCoins size={22} /></div>
          <div className="stat-label">Donasi Dihimpun (Bulan Ini)</div>
          <div className="stat-value">{formatRupiah(stats.nominalBulanIni)}</div>
          <div className="stat-change text-secondary">{stats.jumlahDonasiBulanIni} transaksi tercatat</div>
        </div>

        {/* Donatur Dilayani */}
        <div className="stat-card">
          <div className="stat-icon gold"><Users size={22} /></div>
          <div className="stat-label">Donatur Terlayani</div>
          <div className="stat-value">{stats.totalDonaturDilayani}</div>
          <div className="stat-change text-secondary">Total muzakki/donatur binaan</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card mb-xl" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
        <h3 className="font-bold text-sm mb-md flex items-center gap-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Aksi Cepat Petugas
        </h3>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Link href="/penerimaan" className="btn btn-primary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <PlusCircle size={18} />
            <span className="font-semibold">Catat Donasi Baru</span>
          </Link>
          <Link href="/penerimaan/setor" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <Send size={18} />
            <span className="font-semibold">Setor ke Bendahara</span>
          </Link>
          <Link href="/pendataan" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <UserPlus size={18} />
            <span className="font-semibold">Tambah Donatur</span>
          </Link>
        </div>
      </div>

      {/* Grids: Riwayat Donasi & Status Setoran */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Riwayat Donasi Terbaru */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold flex items-center gap-xs">
              <FileText size={18} color="var(--primary)" />
              Donasi Terbaru Anda
            </h3>
            <Link href="/penerimaan" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
              Lihat Semua <ChevronRight size={14} />
            </Link>
          </div>

          {stats.riwayatDonasi.length === 0 ? (
            <div className="text-center py-xl text-secondary text-sm">Belum ada donasi yang dicatat.</div>
          ) : (
            <div className="stagger">
              {stats.riwayatDonasi.map(d => {
                const badge = getStatusBadge(d.status);
                return (
                  <div key={d.id} className="list-item" style={{ padding: '12px 8px' }}>
                    <div className="list-item-content">
                      <div className="list-item-title font-semibold">{d.donaturName}</div>
                      <div className="list-item-subtitle text-xs text-secondary">
                        {formatTanggalShort(d.tanggal)} · {d.kategoriName}
                      </div>
                    </div>
                    <div className="list-item-trailing text-right">
                      <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatRupiah(d.nominal)}</div>
                      <span className={`badge badge-${badge.variant}`} style={{ fontSize: '10px', marginTop: '2px' }}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Riwayat Setoran */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold flex items-center gap-xs">
              <Send size={18} color="var(--info)" />
              Status Pengajuan Setoran
            </h3>
            <Link href="/penerimaan/setor" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
              Riwayat Setoran <ChevronRight size={14} />
            </Link>
          </div>

          {stats.riwayatSetoran.length === 0 ? (
            <div className="text-center py-xl text-secondary text-sm">Belum ada setoran yang diajukan.</div>
          ) : (
            <div className="stagger">
              {stats.riwayatSetoran.map(s => {
                const badge = getStatusBadge(s.status);
                return (
                  <div key={s.id} className="list-item" style={{ padding: '12px 8px' }}>
                    <div className="list-item-content">
                      <div className="list-item-title font-semibold">{formatRupiah(s.totalNominal)}</div>
                      <div className="list-item-subtitle text-xs text-secondary">
                        Diajukan: {formatTanggalShort(s.tanggal)}
                      </div>
                      {s.catatan && s.status === 'ditolak' && (
                        <div className="text-xs text-danger mt-xs">Catatan: {s.catatan}</div>
                      )}
                    </div>
                    <div className="list-item-trailing text-right">
                      <span className={`badge badge-${badge.variant}`}>
                        {s.status === 'terverifikasi' && <CheckCircle2 size={12} />}
                        {s.status === 'ditolak' && <XCircle size={12} />}
                        {s.status === 'menunggu_verifikasi' && <Clock size={12} />}
                        {badge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
