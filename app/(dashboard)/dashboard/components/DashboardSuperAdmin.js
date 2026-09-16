'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/utils';
import { DashboardBendahara } from './DashboardBendahara';
import { DashboardPetugas } from './DashboardPetugas';
import { DashboardPengawas } from './DashboardPengawas';
import { DashboardAdmin } from './DashboardAdmin';
import {
  ShieldCheck, Wallet, TrendingUp, TrendingDown, Users, 
  Settings, Key, AlertCircle, Eye, HandCoins, ArrowRight,
  Sparkles, CheckCircle2, Clock, Landmark
} from 'lucide-react';

export function DashboardSuperAdmin() {
  const [activeView, setActiveView] = useState('master');
  const { donasi, donatur, setoran, pengeluaran, users, roles, getSaldoPerMetode } = useData();

  const stats = useMemo(() => {
    const saldoPerMetode = getSaldoPerMetode();
    const totalSaldo = Object.values(saldoPerMetode).reduce((sum, s) => sum + s, 0);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const donasiBulanIni = donasi.filter(d => {
      const dt = new Date(d.tanggal);
      return d.status === 'terverifikasi' && dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    });
    const nominalDonasiBulanIni = donasiBulanIni.reduce((sum, d) => sum + d.nominal, 0);

    const pengeluaranBulanIni = pengeluaran.filter(p => {
      const dt = new Date(p.tanggal);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    });
    const nominalPengeluaranBulanIni = pengeluaranBulanIni.reduce((sum, p) => sum + p.nominal, 0);

    const pendingSetoran = setoran.filter(s => s.status === 'menunggu_verifikasi').length;

    // Petugas & users
    const totalUsers = users.length;
    const totalPetugas = users.filter(u => u.roles?.includes('petugas') || u.roleId === 'petugas').length;

    // Petugas Performance Stats
    const petugasStats = users
      .filter(u => u.roles?.includes('petugas') || u.roleId === 'petugas')
      .map(petugas => {
        const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id && d.status === 'terverifikasi');
        const donaturUnik = new Set(donasiPetugas.map(d => d.donaturId)).size;
        const donasiTerhimpun = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);

        const semuaDonasi = donasi.filter(d => d.petugasId === petugas.id);
        const totalTagihan = semuaDonasi.reduce((sum, d) => sum + d.nominal, 0);

        const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
        const setoranDisetujui = setoranPetugas.filter(s => s.status === 'terverifikasi').reduce((sum, s) => sum + s.totalNominal, 0);
        const setoranPending = setoranPetugas.filter(s => s.status === 'menunggu_verifikasi').reduce((sum, s) => sum + s.totalNominal, 0);

        const danaMengendap = Math.max(0, totalTagihan - setoranDisetujui - setoranPending);

        return {
          ...petugas,
          donaturDilayani: donaturUnik,
          donasiTerhimpun,
          setoranDisetujui,
          danaMengendap,
        };
      });

    const totalPetugasStats = {
      donaturDilayani: petugasStats.reduce((sum, p) => sum + p.donaturDilayani, 0),
      donasiTerhimpun: petugasStats.reduce((sum, p) => sum + p.donasiTerhimpun, 0),
      setoranDisetujui: petugasStats.reduce((sum, p) => sum + p.setoranDisetujui, 0),
      danaMengendap: petugasStats.reduce((sum, p) => sum + p.danaMengendap, 0),
    };

    // Bendahara Performance Stats
    const bendaharaStats = users
      .filter(u => u.roles?.includes('bendahara') || u.roleId === 'bendahara')
      .map(bendahara => {
        const setoranDiterima = setoran
          .filter(s => s.status === 'terverifikasi' && (s.verifikasiOleh === bendahara.id || s.verifikasiOleh === null)) // fallback if null but we assign to general bendahara? Let's just use verifikasiOleh if available. If none, we can accumulate it to 'unknown' but it's fine.
          .reduce((sum, s) => sum + s.totalNominal, 0);

        // Actual strict filter
        const strictSetoranDiterima = setoran
          .filter(s => s.status === 'terverifikasi' && s.verifikasiOleh === bendahara.id)
          .reduce((sum, s) => sum + s.totalNominal, 0);

        const penggunaanDana = pengeluaran
          .filter(p => p.dibuatOleh === bendahara.id)
          .reduce((sum, p) => sum + p.nominal, 0);

        return {
          ...bendahara,
          setoranDiterima: strictSetoranDiterima,
          penggunaanDana,
        };
      });

    const totalBendaharaStats = {
      setoranDiterima: bendaharaStats.reduce((sum, b) => sum + b.setoranDiterima, 0),
      penggunaanDana: bendaharaStats.reduce((sum, b) => sum + b.penggunaanDana, 0),
    };

    return {
      totalSaldo,
      nominalDonasiBulanIni,
      nominalPengeluaranBulanIni,
      surplusBulanIni: nominalDonasiBulanIni - nominalPengeluaranBulanIni,
      totalDonatur: donatur.length,
      pendingSetoran,
      totalUsers,
      totalPetugas,
      petugasStats,
      totalPetugasStats,
      bendaharaStats,
      totalBendaharaStats,
    };
  }, [donasi, donatur, setoran, pengeluaran, users, getSaldoPerMetode]);

  return (
    <div className="animate-fade-in-up">
      {/* Role Switcher Toolbar for Super Admin */}
      <div className="card mb-lg" style={{ padding: '14px 18px', background: 'linear-gradient(90deg, rgba(145, 198, 65, 0.12) 0%, var(--bg-card) 100%)', borderLeft: '4px solid var(--primary)' }}>
        <div className="flex justify-between items-center flex-wrap gap-md">
          <div className="flex items-center gap-sm">
            <Sparkles size={20} color="var(--primary)" />
            <div>
              <span className="font-bold text-sm">Mode Pratinjau Tampilan Dashboard:</span>
              <span className="text-xs text-secondary ml-xs hidden-mobile">(Pilih sudut pandang role)</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeView === 'master' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('master')}
            >
              Master Super Admin
            </button>
            <button
              className={`btn btn-sm ${activeView === 'bendahara' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('bendahara')}
            >
              <Eye size={12} style={{ marginRight: '4px' }} /> Bendahara
            </button>
            <button
              className={`btn btn-sm ${activeView === 'petugas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('petugas')}
            >
              <Eye size={12} style={{ marginRight: '4px' }} /> Petugas
            </button>
            <button
              className={`btn btn-sm ${activeView === 'pengawas' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('pengawas')}
            >
              <Eye size={12} style={{ marginRight: '4px' }} /> Pengawas
            </button>
            <button
              className={`btn btn-sm ${activeView === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveView('admin')}
            >
              <Eye size={12} style={{ marginRight: '4px' }} /> Admin
            </button>
          </div>
        </div>
      </div>

      {/* Render selected view */}
      {activeView === 'bendahara' && (
        <div>
          <div className="badge badge-warning mb-md">Pratinjau Tampilan Dashboard Bendahara</div>
          <DashboardBendahara />
        </div>
      )}

      {activeView === 'petugas' && (
        <div>
          <div className="badge badge-warning mb-md">Pratinjau Tampilan Dashboard Petugas</div>
          <DashboardPetugas />
        </div>
      )}

      {activeView === 'pengawas' && (
        <div>
          <div className="badge badge-warning mb-md">Pratinjau Tampilan Dashboard Pengawas</div>
          <DashboardPengawas />
        </div>
      )}

      {activeView === 'admin' && (
        <div>
          <div className="badge badge-warning mb-md">Pratinjau Tampilan Dashboard Admin</div>
          <DashboardAdmin />
        </div>
      )}

      {activeView === 'master' && (
        <div>
          {/* Main KPI Stats */}
          <div className="stats-grid stagger mb-lg">
            <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
              <div className="stat-icon green"><Wallet size={22} /></div>
              <div className="stat-label">Total Kas & Bank Yayasan</div>
              <div className="stat-value">{formatRupiah(stats.totalSaldo)}</div>
              <div className="stat-change text-secondary">Likuiditas riil saat ini</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon blue"><TrendingUp size={22} /></div>
              <div className="stat-label">Donasi Masuk (Bulan Ini)</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>+{formatRupiah(stats.nominalDonasiBulanIni)}</div>
              <div className="stat-change text-secondary">Donasi terverifikasi</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon red"><TrendingDown size={22} /></div>
              <div className="stat-label">Pengeluaran (Bulan Ini)</div>
              <div className="stat-value" style={{ color: 'var(--danger)' }}>-{formatRupiah(stats.nominalPengeluaranBulanIni)}</div>
              <div className="stat-change text-secondary">
                Surplus: <strong style={{ color: stats.surplusBulanIni >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(stats.surplusBulanIni)}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon gold"><Users size={22} /></div>
              <div className="stat-label">Total Donatur</div>
              <div className="stat-value">{stats.totalDonatur}</div>
              <div className="stat-change text-secondary">{stats.totalPetugas} Petugas Aktif</div>
            </div>
          </div>

          {/* Quick Actions & System Control */}
          <div className="card mb-xl" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
            <h3 className="font-bold text-sm mb-md flex items-center gap-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
              Akses Cepat Super Admin
            </h3>
            <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <Link href="/pengaturan" className="btn btn-primary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                <Settings size={18} />
                <span className="font-semibold">Konfigurasi Sistem</span>
              </Link>
              <Link href="/keuangan" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                <Clock size={18} />
                <span className="font-semibold">Verifikasi Setoran ({stats.pendingSetoran})</span>
              </Link>
              <Link href="/laporan" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
                <TrendingUp size={18} />
                <span className="font-semibold">Semua Laporan</span>
              </Link>
            </div>
          </div>

          {/* Kinerja & Rekapitulasi Petugas Lapangan */}
          <div className="card mb-lg" style={{ padding: '0' }}>
            <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold flex items-center gap-xs">
                <Users size={18} color="var(--primary)" />
                Kinerja & Rekapitulasi Petugas Lapangan
              </h3>
            </div>
            <div className="table-container table-mobile" style={{ borderRadius: '0', border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Petugas</th>
                    <th className="text-center">Donatur Dilayani</th>
                    <th className="text-right">Donasi Terhimpun</th>
                    <th className="text-right">Setoran Diverifikasi</th>
                    <th className="text-right">Dana di Tangan (Mengendap)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.petugasStats.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-secondary py-lg">Tidak ada data petugas</td>
                    </tr>
                  ) : (
                    stats.petugasStats.map(petugas => (
                      <tr key={petugas.id}>
                        <td data-label="Nama Petugas" className="font-semibold">{petugas.name}</td>
                        <td data-label="Donatur Dilayani" className="text-center">{petugas.donaturDilayani} org</td>
                        <td data-label="Donasi Terhimpun" className="text-right text-success">{formatRupiah(petugas.donasiTerhimpun)}</td>
                        <td data-label="Setoran Diverifikasi" className="text-right text-info">{formatRupiah(petugas.setoranDisetujui)}</td>
                        <td data-label="Dana Mengendap" className="text-right font-bold" style={{ color: petugas.danaMengendap > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                          {formatRupiah(petugas.danaMengendap)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stats.petugasStats.length > 0 && (
                  <tfoot style={{ background: 'var(--bg-elevated)', fontWeight: 'bold' }}>
                    <tr>
                      <td data-label="Akumulasi" className="text-right">AKUMULASI TOTAL</td>
                      <td data-label="Total Donatur" className="text-center text-primary-color">{stats.totalPetugasStats.donaturDilayani} org</td>
                      <td data-label="Total Terhimpun" className="text-right text-success">{formatRupiah(stats.totalPetugasStats.donasiTerhimpun)}</td>
                      <td data-label="Total Disetor" className="text-right text-info">{formatRupiah(stats.totalPetugasStats.setoranDisetujui)}</td>
                      <td data-label="Total Mengendap" className="text-right text-warning">{formatRupiah(stats.totalPetugasStats.danaMengendap)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Kinerja & Rekapitulasi Bendahara */}
          <div className="card mb-xl" style={{ padding: '0' }}>
            <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border)' }}>
              <h3 className="font-bold flex items-center gap-xs">
                <Landmark size={18} color="var(--primary)" />
                Kinerja & Rekapitulasi Bendahara
              </h3>
            </div>
            <div className="table-container table-mobile" style={{ borderRadius: '0', border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nama Bendahara</th>
                    <th className="text-right">Donasi/Setoran Diterima</th>
                    <th className="text-right">Penggunaan Dana (Pengeluaran)</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.bendaharaStats.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center text-secondary py-lg">Tidak ada data bendahara</td>
                    </tr>
                  ) : (
                    stats.bendaharaStats.map(bendahara => (
                      <tr key={bendahara.id}>
                        <td data-label="Nama Bendahara" className="font-semibold">{bendahara.name}</td>
                        <td data-label="Setoran Diterima" className="text-right text-info">{formatRupiah(bendahara.setoranDiterima)}</td>
                        <td data-label="Penggunaan Dana" className="text-right text-danger">-{formatRupiah(bendahara.penggunaanDana)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {stats.bendaharaStats.length > 0 && (
                  <tfoot style={{ background: 'var(--bg-elevated)', fontWeight: 'bold' }}>
                    <tr>
                      <td data-label="Akumulasi" className="text-right">AKUMULASI TOTAL</td>
                      <td data-label="Total Diterima" className="text-right text-info">{formatRupiah(stats.totalBendaharaStats.setoranDiterima)}</td>
                      <td data-label="Total Digunakan" className="text-right text-danger">-{formatRupiah(stats.totalBendaharaStats.penggunaanDana)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Grids: Manajemen Pengguna & Audit Ringkas */}
          <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {/* Ringkasan Pengguna Sistem */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div className="flex justify-between items-center mb-md">
                <h3 className="font-bold flex items-center gap-xs">
                  <Key size={18} color="var(--primary)" />
                  Pengguna Sistem & Role RBAC
                </h3>
                <Link href="/pengaturan" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
                  Kelola <ArrowRight size={14} />
                </Link>
              </div>

              <div className="stagger">
                {users.map(u => (
                  <div key={u.id} className="list-item" style={{ padding: '10px 8px' }}>
                    <div className="list-item-avatar" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
                      {u.avatar || u.name?.charAt(0)}
                    </div>
                    <div className="list-item-content">
                      <div className="list-item-title font-semibold">{u.name}</div>
                      <div className="list-item-subtitle text-xs text-secondary">{u.email}</div>
                    </div>
                    <div className="list-item-trailing">
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {u.roles?.join(', ') || 'User'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Sistem & Keamanan */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 className="font-bold mb-md flex items-center gap-xs">
                <ShieldCheck size={18} color="var(--success)" />
                Status Sistem & Keamanan
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <div>
                    <div className="font-semibold text-sm">Role Based Access Control (RBAC)</div>
                    <div className="text-xs text-secondary">5 Role aktif dengan hak akses terisolasi</div>
                  </div>
                  <span className="badge badge-success">Aktif</span>
                </div>

                <div className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <div>
                    <div className="font-semibold text-sm">Setoran Pending Verifikasi</div>
                    <div className="text-xs text-secondary">Menunggu tindakan dari bendahara</div>
                  </div>
                  <span className={`badge badge-${stats.pendingSetoran > 0 ? 'warning' : 'success'}`}>
                    {stats.pendingSetoran} Pengajuan
                  </span>
                </div>

                <div className="flex justify-between items-center p-sm" style={{ background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <div>
                    <div className="font-semibold text-sm">Database & Session Storage</div>
                    <div className="text-xs text-secondary">Penyimpanan lokal tersinkronisasi aman</div>
                  </div>
                  <span className="badge badge-success">Optimal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
