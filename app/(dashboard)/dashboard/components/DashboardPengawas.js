'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatPersen } from '@/lib/mock';
import {
  Landmark, TrendingUp, TrendingDown, Users, PieChart, 
  BarChart3, ShieldCheck, AlertCircle, ArrowUpRight, ChevronRight,
  HandCoins, FileSpreadsheet
} from 'lucide-react';

export function DashboardPengawas() {
  const { donasi, donatur, setoran, pengeluaran, kategoriDonasi, users, getSaldoPerMetode } = useData();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const stats = useMemo(() => {
    const tahun = parseInt(selectedYear);
    const saldoPerMetode = getSaldoPerMetode();
    const totalSaldo = Object.values(saldoPerMetode).reduce((sum, s) => sum + s, 0);

    // Donasi verified tahun berjalan
    const verifiedDonasiTahun = donasi.filter(d => {
      const dt = new Date(d.tanggal);
      return d.status === 'terverifikasi' && dt.getFullYear() === tahun;
    });
    const totalPenghimpunanYTD = verifiedDonasiTahun.reduce((sum, d) => sum + d.nominal, 0);

    // Pengeluaran tahun berjalan
    const pengeluaranTahun = pengeluaran.filter(p => {
      const dt = new Date(p.tanggal);
      return dt.getFullYear() === tahun;
    });
    const totalPenyaluranYTD = pengeluaranTahun.reduce((sum, p) => sum + p.nominal, 0);

    // Rasio Penyaluran
    const rasioPenyaluran = totalPenghimpunanYTD > 0 
      ? Math.round((totalPenyaluranYTD / totalPenghimpunanYTD) * 100) 
      : 0;

    // Total dana mengendap di petugas
    const petugasList = users.filter(u => u.roles?.includes('petugas'));
    let totalMengendapSemuaPetugas = 0;

    petugasList.forEach(petugas => {
      const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id);
      const totalTagihan = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);
      const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
      const totalDisetor = setoranPetugas
        .filter(s => s.status === 'terverifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);
      const totalPending = setoranPetugas
        .filter(s => s.status === 'menunggu_verifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const mengendap = Math.max(0, totalTagihan - totalDisetor - totalPending);
      totalMengendapSemuaPetugas += mengendap;
    });

    // Breakdown per Kategori Donasi
    const kategoriBreakdown = kategoriDonasi.map(kat => {
      const donasiKat = verifiedDonasiTahun.filter(d => d.kategoriId === kat.id);
      const nominal = donasiKat.reduce((sum, d) => sum + d.nominal, 0);
      const persen = totalPenghimpunanYTD > 0 ? ((nominal / totalPenghimpunanYTD) * 100).toFixed(1) : 0;
      return {
        ...kat,
        nominal,
        persen,
        count: donasiKat.length,
      };
    }).filter(k => k.nominal > 0).sort((a, b) => b.nominal - a.nominal);

    // Monthly data for chart
    const bulanLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlySeries = bulanLabels.map((lbl, idx) => {
      const inc = donasi
        .filter(d => d.status === 'terverifikasi' && new Date(d.tanggal).getFullYear() === tahun && new Date(d.tanggal).getMonth() === idx)
        .reduce((sum, d) => sum + d.nominal, 0);
      const exp = pengeluaran
        .filter(p => new Date(p.tanggal).getFullYear() === tahun && new Date(p.tanggal).getMonth() === idx)
        .reduce((sum, p) => sum + p.nominal, 0);
      return { bulan: lbl, bulanIdx: idx, penerimaan: inc, pengeluaran: exp };
    });

    const maxChartValue = Math.max(...monthlySeries.map(m => Math.max(m.penerimaan, m.pengeluaran)), 1);

    return {
      totalSaldo,
      totalPenghimpunanYTD,
      totalPenyaluranYTD,
      rasioPenyaluran,
      totalMengendapSemuaPetugas,
      totalDonatur: donatur.length,
      kategoriBreakdown,
      monthlySeries,
      maxChartValue,
    };
  }, [selectedYear, donasi, donatur, setoran, pengeluaran, kategoriDonasi, users, getSaldoPerMetode]);

  return (
    <div className="animate-fade-in-up">
      {/* Executive Welcome & Year Selector */}
      <div className="flex justify-between items-center mb-lg flex-wrap gap-md">
        <div>
          <div className="badge badge-success mb-xs flex items-center gap-xs" style={{ display: 'inline-flex' }}>
            <ShieldCheck size={12} /> Dashboard Dewan Pengawas & Pimpinan
          </div>
          <h2 className="font-bold text-lg" style={{ margin: 0 }}>Laporan Eksekutif & Kinerja Lembaga</h2>
        </div>
        <div className="flex items-center gap-sm">
          <span className="text-sm text-secondary">Tahun Buku:</span>
          <select 
            className="form-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ width: '120px', padding: '6px 12px' }}
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="stats-grid stagger mb-lg">
        {/* Total Saldo Bersih */}
        <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-icon green"><Landmark size={22} /></div>
          <div className="stat-label">Total Saldo Kas & Bank</div>
          <div className="stat-value">{formatRupiah(stats.totalSaldo)}</div>
          <div className="stat-change text-secondary">Posisi kas likuid yayasan</div>
        </div>

        {/* Penghimpunan Donasi YTD */}
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={22} /></div>
          <div className="stat-label">Penghimpunan ({selectedYear})</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>+{formatRupiah(stats.totalPenghimpunanYTD)}</div>
          <div className="stat-change text-secondary">Akumulasi donasi terverifikasi</div>
        </div>

        {/* Penyaluran YTD */}
        <div className="stat-card">
          <div className="stat-icon red"><TrendingDown size={22} /></div>
          <div className="stat-label">Penyaluran / Pengeluaran</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>-{formatRupiah(stats.totalPenyaluranYTD)}</div>
          <div className="stat-change text-secondary">
            Rasio Penyaluran: <strong style={{ color: 'var(--info)' }}>{stats.rasioPenyaluran}%</strong>
          </div>
        </div>

        {/* Dana Lapangan & Donatur */}
        <div className="stat-card">
          <div className="stat-icon gold"><Users size={22} /></div>
          <div className="stat-label">Total Donatur Terdaftar</div>
          <div className="stat-value">{stats.totalDonatur}</div>
          <div className="stat-change text-secondary">
            Uang di Petugas: <strong style={{ color: stats.totalMengendapSemuaPetugas > 0 ? 'var(--warning)' : 'var(--success)' }}>{formatRupiah(stats.totalMengendapSemuaPetugas)}</strong>
          </div>
        </div>
      </div>

      {/* Visual Chart: Penerimaan vs Penyaluran Bulanan */}
      <div className="card mb-xl" style={{ padding: 'var(--space-lg)' }}>
        <div className="flex justify-between items-center mb-lg">
          <div>
            <h3 className="font-bold flex items-center gap-xs">
              <BarChart3 size={18} color="var(--primary)" />
              Tren Penghimpunan vs Penyaluran Tahun {selectedYear}
            </h3>
            <p className="text-xs text-secondary mt-xs">Perbandingan arus dana masuk dan penyaluran program per bulan</p>
          </div>
          <div className="flex items-center gap-md text-xs">
            <div className="flex items-center gap-xs">
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--success)' }} />
              <span className="text-secondary">Penerimaan</span>
            </div>
            <div className="flex items-center gap-xs">
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--danger)' }} />
              <span className="text-secondary">Penyaluran</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.monthlySeries.map(m => (
            <div key={m.bulanIdx} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', alignItems: 'center', gap: '12px' }}>
              <span className="text-xs font-semibold text-secondary">{m.bulan}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Penerimaan */}
                <div style={{ 
                  height: '10px', 
                  width: `${Math.max(1, (m.penerimaan / stats.maxChartValue) * 100)}%`, 
                  background: 'var(--success)', 
                  borderRadius: '3px',
                  minWidth: m.penerimaan > 0 ? '4px' : '0px'
                }} />
                {/* Penyaluran */}
                <div style={{ 
                  height: '10px', 
                  width: `${Math.max(1, (m.pengeluaran / stats.maxChartValue) * 100)}%`, 
                  background: 'var(--danger)', 
                  borderRadius: '3px',
                  minWidth: m.pengeluaran > 0 ? '4px' : '0px'
                }} />
              </div>
              <div className="text-right text-xs" style={{ minWidth: '120px' }}>
                <span style={{ color: 'var(--success)', marginRight: '8px' }}>+{formatRupiah(m.penerimaan)}</span>
                <span style={{ color: 'var(--danger)' }}>-{formatRupiah(m.pengeluaran)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grids: Komposisi Kategori & Shortcut Laporan */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Distribusi Peruntukan Donasi */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="font-bold mb-md flex items-center gap-xs">
            <PieChart size={18} color="var(--accent)" />
            Komposisi Donasi per Program ({selectedYear})
          </h3>
          <div className="stagger">
            {stats.kategoriBreakdown.map(kat => (
              <div key={kat.id} className="list-item" style={{ padding: '10px 0' }}>
                <div className="list-item-content">
                  <div className="flex justify-between items-center mb-xs">
                    <span className="font-semibold text-sm">{kat.nama}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{formatRupiah(kat.nominal)} ({kat.persen}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-main)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${kat.persen}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Akses Cepat Laporan Lengkap */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <h3 className="font-bold mb-md flex items-center gap-xs">
            <FileSpreadsheet size={18} color="var(--info)" />
            Pusat Laporan & Audit
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Link href="/laporan/pendapatan" className="list-item hover-card" style={{ padding: '14px', textDecoration: 'none', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div className="list-item-content">
                <div className="font-semibold text-sm text-primary-color">Laporan Pendapatan & Donatur</div>
                <div className="text-xs text-secondary">Rincian per donatur, kategori, dan kolektabilitas</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </Link>

            <Link href="/laporan/pengeluaran" className="list-item hover-card" style={{ padding: '14px', textDecoration: 'none', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div className="list-item-content">
                <div className="font-semibold text-sm text-primary-color">Laporan Realisasi Pengeluaran</div>
                <div className="text-xs text-secondary">Audit realisasi anggaran pos pengeluaran</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </Link>

            <Link href="/laporan/serah-terima" className="list-item hover-card" style={{ padding: '14px', textDecoration: 'none', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div className="list-item-content">
                <div className="font-semibold text-sm text-primary-color">Laporan Serah Terima Dana</div>
                <div className="text-xs text-secondary">Mutasi setoran dari amil ke bendahara</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </Link>

            <Link href="/laporan/akuntansi" className="list-item hover-card" style={{ padding: '14px', textDecoration: 'none', borderRadius: 'var(--radius-md)', background: 'var(--bg-main)' }}>
              <div className="list-item-content">
                <div className="font-semibold text-sm text-primary-color">Laporan Akuntansi & Keuangan</div>
                <div className="text-xs text-secondary">Buku Kas & Bank, Posisi Saldo, Aktivitas</div>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
