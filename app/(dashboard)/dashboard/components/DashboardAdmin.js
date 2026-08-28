'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import {
  Users, UserPlus, HandCoins, Settings, BarChart2,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  Layers, Award
} from 'lucide-react';

export function DashboardAdmin() {
  const { donasi, donatur, setoran, users } = useData();

  const stats = useMemo(() => {
    const totalDonatur = donatur.length;
    const donaturAktif = donatur.filter(d => d.status === 'aktif' || !d.status).length;
    const donaturPasif = totalDonatur - donaturAktif;

    // Transaksi hari ini
    const todayStr = new Date().toISOString().split('T')[0];
    const donasiHariIni = donasi.filter(d => d.tanggal === todayStr);
    const nominalHariIni = donasiHariIni.reduce((sum, d) => sum + d.nominal, 0);

    // Donatur baru bulan ini
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const donaturBaruBulanIni = donatur.filter(d => {
      if (!d.createdAt) return false;
      const dt = new Date(d.createdAt);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    }).length;

    // Kinerja Petugas
    const petugasList = users.filter(u => u.roles?.includes('petugas'));
    const petugasLeaderboard = petugasList.map(petugas => {
      const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id);
      const totalTerkumpul = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);
      const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
      const totalDisetor = setoranPetugas
        .filter(s => s.status === 'terverifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);
      const totalPending = setoranPetugas
        .filter(s => s.status === 'menunggu_verifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const mengendap = Math.max(0, totalTerkumpul - totalDisetor - totalPending);

      return {
        ...petugas,
        totalTerkumpul,
        jumlahTransaksi: donasiPetugas.length,
        mengendap,
        pendingCount: setoranPetugas.filter(s => s.status === 'menunggu_verifikasi').length,
      };
    }).sort((a, b) => b.totalTerkumpul - a.totalTerkumpul);

    // Status donasi summary
    const verifiedCount = donasi.filter(d => d.status === 'terverifikasi').length;
    const belumSetorCount = donasi.filter(d => d.status === 'belum_disetor').length;
    const menungguVerifSetoran = setoran.filter(s => s.status === 'menunggu_verifikasi').length;

    return {
      totalDonatur,
      donaturAktif,
      donaturPasif,
      jumlahDonasiHariIni: donasiHariIni.length,
      nominalHariIni,
      donaturBaruBulanIni,
      totalPetugas: petugasList.length,
      petugasLeaderboard,
      verifiedCount,
      belumSetorCount,
      menungguVerifSetoran,
    };
  }, [donasi, donatur, setoran, users]);

  return (
    <div className="animate-fade-in-up">
      {/* Main KPI Stats */}
      <div className="stats-grid stagger mb-lg">
        {/* Total Donatur */}
        <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-icon gold"><Users size={22} /></div>
          <div className="stat-label">Total Donatur Terdaftar</div>
          <div className="stat-value">{stats.totalDonatur}</div>
          <div className="stat-change text-secondary">
            {stats.donaturAktif} Aktif · {stats.donaturPasif} Pasif
          </div>
        </div>

        {/* Transaksi Hari Ini */}
        <div className="stat-card">
          <div className="stat-icon green"><HandCoins size={22} /></div>
          <div className="stat-label">Transaksi Hari Ini</div>
          <div className="stat-value">{formatRupiah(stats.nominalHariIni)}</div>
          <div className="stat-change text-secondary">{stats.jumlahDonasiHariIni} transaksi baru</div>
        </div>

        {/* Donatur Baru Bulan Ini */}
        <div className="stat-card">
          <div className="stat-icon blue"><UserPlus size={22} /></div>
          <div className="stat-label">Donatur Baru (Bulan Ini)</div>
          <div className="stat-value">{stats.donaturBaruBulanIni}</div>
          <div className="stat-change text-secondary">Pertumbuhan basis donatur</div>
        </div>

        {/* Petugas Lapangan Aktif */}
        <div className="stat-card">
          <div className="stat-icon blue"><Layers size={22} /></div>
          <div className="stat-label">Petugas Lapangan</div>
          <div className="stat-value">{stats.totalPetugas} Amil</div>
          <div className="stat-change text-secondary">Tim penerimaan donasi</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card mb-xl" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
        <h3 className="font-bold text-sm mb-md flex items-center gap-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Aksi Cepat Admin Operasional
        </h3>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Link href="/pendataan" className="btn btn-primary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <UserPlus size={18} />
            <span className="font-semibold">+ Tambah Donatur</span>
          </Link>
          <Link href="/laporan/pendapatan" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <BarChart2 size={18} />
            <span className="font-semibold">Laporan Pendapatan</span>
          </Link>
          <Link href="/pengaturan" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <Settings size={18} />
            <span className="font-semibold">Master Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Grids: Kinerja Petugas & Ringkasan Pipeline Transaksi */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Kinerja & Leaderboard Petugas */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold flex items-center gap-xs">
              <Award size={18} color="var(--accent)" />
              Kinerja Petugas Lapangan
            </h3>
            <Link href="/laporan/serah-terima" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
              Monitoring Setoran <ArrowRight size={14} />
            </Link>
          </div>

          <div className="stagger">
            {stats.petugasLeaderboard.map((p, idx) => (
              <div key={p.id} className="list-item" style={{ padding: '12px 8px' }}>
                <div className="list-item-avatar" style={{ background: idx === 0 ? 'var(--accent-bg)' : 'var(--primary-bg)', color: idx === 0 ? 'var(--accent)' : 'var(--primary)' }}>
                  {p.avatar || p.name?.charAt(0)}
                </div>
                <div className="list-item-content">
                  <div className="list-item-title font-semibold flex items-center gap-xs">
                    {p.name}
                    {idx === 0 && <span className="badge badge-accent" style={{ fontSize: '10px' }}>Top</span>}
                  </div>
                  <div className="list-item-subtitle text-xs text-secondary">
                    {p.jumlahTransaksi} donasi dicatat
                  </div>
                </div>
                <div className="list-item-trailing text-right">
                  <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatRupiah(p.totalTerkumpul)}</div>
                  {p.mengendap > 0 ? (
                    <div className="text-xs" style={{ color: 'var(--warning)' }}>
                      Belum setor: {formatRupiah(p.mengendap)}
                    </div>
                  ) : (
                    <div className="text-xs text-secondary" style={{ color: 'var(--success)' }}>
                      Setoran lunas
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ringkasan Status Transaksi */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="font-bold mb-md flex items-center gap-xs">
            <Layers size={18} color="var(--info)" />
            Ringkasan Status Transaksi & Setoran
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="card" style={{ padding: '14px', background: 'var(--bg-main)', borderLeft: '4px solid var(--success)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <CheckCircle2 size={20} color="var(--success)" />
                  <span className="font-semibold text-sm">Donasi Terverifikasi (Masuk Kas)</span>
                </div>
                <span className="font-bold text-md text-success">{stats.verifiedCount} Transaksi</span>
              </div>
            </div>

            <div className="card" style={{ padding: '14px', background: 'var(--bg-main)', borderLeft: '4px solid var(--warning)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <AlertTriangle size={20} color="var(--warning)" />
                  <span className="font-semibold text-sm">Donasi Belum Disetor ke Bendahara</span>
                </div>
                <span className="font-bold text-md" style={{ color: 'var(--warning)' }}>{stats.belumSetorCount} Transaksi</span>
              </div>
            </div>

            <div className="card" style={{ padding: '14px', background: 'var(--bg-main)', borderLeft: '4px solid var(--info)' }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-sm">
                  <Clock size={20} color="var(--info)" />
                  <span className="font-semibold text-sm">Setoran Menunggu Verifikasi Bendahara</span>
                </div>
                <span className="font-bold text-md" style={{ color: 'var(--info)' }}>{stats.menungguVerifSetoran} Pengajuan</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
