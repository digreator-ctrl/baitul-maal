'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import {
  Wallet, Landmark, TrendingUp, TrendingDown, Clock, 
  CheckCircle2, ArrowRight, ArrowDownLeft, ArrowUpRight,
  PlusCircle, BookOpen, AlertCircle
} from 'lucide-react';

export function DashboardBendahara() {
  const { donasi, setoran, pengeluaran, metodeDonasi, users, posPengeluaran, getSaldoPerMetode } = useData();

  const stats = useMemo(() => {
    const saldoPerMetode = getSaldoPerMetode();
    const totalKasBank = Object.values(saldoPerMetode).reduce((sum, s) => sum + s, 0);

    const pendingSetoranList = setoran
      .filter(s => s.status === 'menunggu_verifikasi')
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    const totalPendingNominal = pendingSetoranList.reduce((sum, s) => sum + s.totalNominal, 0);

    // Bulan ini
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const donasiBulanIni = donasi.filter(d => {
      const dt = new Date(d.tanggal);
      return d.status === 'terverifikasi' && dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    });
    const nominalPenerimaanBulanIni = donasiBulanIni.reduce((sum, d) => sum + d.nominal, 0);

    const pengeluaranBulanIni = pengeluaran.filter(p => {
      const dt = new Date(p.tanggal);
      return dt.getFullYear() === currentYear && dt.getMonth() === currentMonth;
    });
    const nominalPengeluaranBulanIni = pengeluaranBulanIni.reduce((sum, p) => sum + p.nominal, 0);

    // Dana mengendap di seluruh petugas
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

    // Recent 5 pengeluaran
    const riwayatPengeluaran = [...pengeluaran]
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
      .slice(0, 5)
      .map(p => {
        const pos = posPengeluaran.find(k => k.id === p.posId);
        const metode = metodeDonasi.find(m => m.id === p.metodeId);
        return {
          ...p,
          posName: pos?.nama || 'Operasional',
          metodeName: metode?.nama || 'Kas Tunai',
        };
      });

    return {
      totalKasBank,
      saldoPerMetode,
      pendingSetoranList,
      totalPendingNominal,
      nominalPenerimaanBulanIni,
      nominalPengeluaranBulanIni,
      surplusBulanIni: nominalPenerimaanBulanIni - nominalPengeluaranBulanIni,
      totalMengendapSemuaPetugas,
      riwayatPengeluaran,
    };
  }, [donasi, setoran, pengeluaran, metodeDonasi, users, posPengeluaran, getSaldoPerMetode]);

  return (
    <div className="animate-fade-in-up">
      {/* Action Banner: Setoran Menunggu Verifikasi */}
      {stats.pendingSetoranList.length > 0 && (
        <div className="card mb-lg" style={{ borderLeft: '4px solid var(--warning)', background: 'var(--warning-bg)' }}>
          <div className="flex justify-between items-center flex-wrap gap-md">
            <div className="flex items-center gap-md">
              <Clock size={28} color="var(--warning)" />
              <div>
                <div className="font-bold text-md" style={{ color: 'var(--warning)' }}>
                  Ada {stats.pendingSetoranList.length} Setoran Petugas Menunggu Verifikasi ({formatRupiah(stats.totalPendingNominal)})
                </div>
                <div className="text-sm text-secondary">
                  Periksa bukti transfer/setoran fisik dan lakukan verifikasi agar dana masuk ke kas resmi.
                </div>
              </div>
            </div>
            <Link href="/keuangan" className="btn btn-primary flex items-center gap-xs" style={{ textDecoration: 'none', background: 'var(--warning)', color: '#000' }}>
              Verifikasi Sekarang <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="stats-grid stagger mb-lg">
        {/* Total Saldo Kas & Bank */}
        <div className="stat-card" style={{ borderTop: '3px solid var(--primary)' }}>
          <div className="stat-icon green"><Wallet size={22} /></div>
          <div className="stat-label">Total Saldo Kas & Bank</div>
          <div className="stat-value">{formatRupiah(stats.totalKasBank)}</div>
          <div className="stat-change text-secondary">
            Likuiditas riil di bendahara
          </div>
        </div>

        {/* Penerimaan Bulan Ini */}
        <div className="stat-card">
          <div className="stat-icon blue"><ArrowDownLeft size={22} /></div>
          <div className="stat-label">Penerimaan (Bulan Ini)</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>+{formatRupiah(stats.nominalPenerimaanBulanIni)}</div>
          <div className="stat-change text-secondary">Donasi terverifikasi</div>
        </div>

        {/* Pengeluaran Bulan Ini */}
        <div className="stat-card">
          <div className="stat-icon red"><ArrowUpRight size={22} /></div>
          <div className="stat-label">Pengeluaran (Bulan Ini)</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>-{formatRupiah(stats.nominalPengeluaranBulanIni)}</div>
          <div className="stat-change text-secondary">
            Surplus: <strong style={{ color: stats.surplusBulanIni >= 0 ? 'var(--success)' : 'var(--danger)' }}>{formatRupiah(stats.surplusBulanIni)}</strong>
          </div>
        </div>

        {/* Dana Mengendap di Petugas */}
        <div className="stat-card">
          <div className="stat-icon gold"><Landmark size={22} /></div>
          <div className="stat-label">Uang di Petugas (Belum Disetor)</div>
          <div className="stat-value" style={{ color: stats.totalMengendapSemuaPetugas > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
            {formatRupiah(stats.totalMengendapSemuaPetugas)}
          </div>
          <div className="stat-change text-secondary">Dana lapangan yang belum disetor</div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card mb-xl" style={{ padding: '20px', background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)' }}>
        <h3 className="font-bold text-sm mb-md flex items-center gap-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
          Aksi Cepat Bendahara
        </h3>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Link href="/keuangan" className="btn btn-primary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <CheckCircle2 size={18} />
            <span className="font-semibold">Verifikasi Setoran ({stats.pendingSetoranList.length})</span>
          </Link>
          <Link href="/keuangan/pengeluaran" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <PlusCircle size={18} />
            <span className="font-semibold">Catat Pengeluaran Baru</span>
          </Link>
          <Link href="/laporan/akuntansi" className="btn btn-secondary flex items-center justify-center gap-sm" style={{ padding: '14px', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            <BookOpen size={18} />
            <span className="font-semibold">Buku Kas & Bank</span>
          </Link>
        </div>
      </div>

      {/* Saldo per Rekening / Metode Pembayaran */}
      <div className="card mb-xl" style={{ padding: 'var(--space-lg)' }}>
        <h3 className="font-bold mb-md flex items-center gap-xs">
          <Wallet size={18} color="var(--primary)" />
          Rincian Saldo per Rekening / Kas Brankas
        </h3>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {metodeDonasi.filter(m => m.aktif).map(m => {
            const saldo = stats.saldoPerMetode[m.id] || 0;
            return (
              <div key={m.id} className="card" style={{ padding: 'var(--space-md)', background: 'var(--bg-main)' }}>
                <div className="text-xs text-secondary mb-xs">{m.nama}</div>
                <div className="font-bold text-lg" style={{ color: saldo > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                  {formatRupiah(saldo)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grids: Antrean Setoran & Pengeluaran Terkini */}
      <div className="grid gap-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {/* Antrean Setoran Menunggu Verifikasi */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold flex items-center gap-xs">
              <Clock size={18} color="var(--warning)" />
              Antrean Setoran Masuk
            </h3>
            <Link href="/keuangan" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
              Semua Setoran <ArrowRight size={14} />
            </Link>
          </div>

          {stats.pendingSetoranList.length === 0 ? (
            <div className="text-center py-xl text-secondary text-sm">
              <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px auto' }} />
              Tidak ada setoran yang menunggu verifikasi saat ini.
            </div>
          ) : (
            <div className="stagger">
              {stats.pendingSetoranList.slice(0, 5).map(s => {
                const petugas = users.find(u => u.id === s.petugasId);
                const metode = metodeDonasi.find(m => m.id === s.metodeDonasiId);
                return (
                  <div key={s.id} className="list-item" style={{ padding: '12px 8px' }}>
                    <div className="list-item-content">
                      <div className="list-item-title font-semibold">{petugas?.name || 'Petugas'}</div>
                      <div className="list-item-subtitle text-xs text-secondary">
                        {formatTanggalShort(s.tanggal)} · Tujuan: {metode?.nama || 'Kas'}
                      </div>
                    </div>
                    <div className="list-item-trailing text-right">
                      <div className="font-bold text-sm" style={{ color: 'var(--warning)' }}>{formatRupiah(s.totalNominal)}</div>
                      <Link href="/keuangan" className="badge badge-warning mt-xs" style={{ textDecoration: 'none' }}>
                        Verifikasi
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pengeluaran Terakhir */}
        <div className="card" style={{ padding: 'var(--space-lg)' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 className="font-bold flex items-center gap-xs">
              <TrendingDown size={18} color="var(--danger)" />
              Pengeluaran Terakhir
            </h3>
            <Link href="/keuangan/pengeluaran" className="text-sm font-semibold flex items-center gap-xs" style={{ color: 'var(--primary)' }}>
              Semua Pengeluaran <ArrowRight size={14} />
            </Link>
          </div>

          {stats.riwayatPengeluaran.length === 0 ? (
            <div className="text-center py-xl text-secondary text-sm">Belum ada catatan pengeluaran.</div>
          ) : (
            <div className="stagger">
              {stats.riwayatPengeluaran.map(p => (
                <div key={p.id} className="list-item" style={{ padding: '12px 8px' }}>
                  <div className="list-item-content">
                    <div className="list-item-title font-semibold">{p.keterangan || p.posName}</div>
                    <div className="list-item-subtitle text-xs text-secondary">
                      {formatTanggalShort(p.tanggal)} · {p.posName} ({p.metodeName})
                    </div>
                  </div>
                  <div className="list-item-trailing text-right">
                    <div className="font-bold text-sm" style={{ color: 'var(--danger)' }}>-{formatRupiah(p.nominal)}</div>
                    <div className="text-xs text-tertiary">{p.penerima || '-'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
