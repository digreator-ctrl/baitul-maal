'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function BukuKasPage() {
  const { user } = useAuth();
  const { donasi, pengeluaran, metodeDonasi, posPengeluaran, kategoriDonasi, donatur, getSaldoPerMetode } = useData();
  const router = useRouter();

  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);
  const totalSaldo = useMemo(() => Object.values(saldo).reduce((sum, s) => sum + s, 0), [saldo]);

  // Build mutation timeline
  const mutations = useMemo(() => {
    const items = [];

    // Verified donations as incoming
    donasi.filter(d => d.status === 'terverifikasi').forEach(d => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
      items.push({
        id: d.id,
        tanggal: d.tanggal,
        type: 'masuk',
        nominal: d.nominal,
        metode: met?.nama || '-',
        metodeId: d.metodeDonasiId,
        keterangan: `${don?.nama || '-'} - ${kat?.nama || '-'}`,
      });
    });

    // Expenses as outgoing
    pengeluaran.forEach(p => {
      const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      items.push({
        id: p.id,
        tanggal: p.tanggal,
        type: 'keluar',
        nominal: p.nominal,
        metode: met?.nama || '-',
        metodeId: p.sumberDanaId,
        keterangan: `${pos?.nama || '-'}${p.keterangan ? ' - ' + p.keterangan : ''}`,
      });
    });

    return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Buku Kas</h1>
        <p>Saldo & mutasi per metode donasi</p>
      </div>

      {/* Total Saldo */}
      <div className="saldo-card mb-lg">
        <div className="saldo-label">Total Saldo Keseluruhan</div>
        <div className="saldo-amount">{formatRupiah(totalSaldo)}</div>
        <div className="saldo-detail">
          <span>
            <TrendingUp size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
            Masuk: {formatRupiah(donasi.filter(d => d.status === 'terverifikasi').reduce((s, d) => s + d.nominal, 0))}
          </span>
          <span>
            <TrendingDown size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
            Keluar: {formatRupiah(pengeluaran.reduce((s, p) => s + p.nominal, 0))}
          </span>
        </div>
      </div>

      {/* Saldo per Metode */}
      <h3 className="font-semibold mb-md">Saldo per Metode</h3>
      <div className="grid gap-sm mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {metodeDonasi.filter(m => m.aktif).map(m => {
          const s = saldo[m.id] || 0;
          const masuk = donasi.filter(d => d.status === 'terverifikasi' && d.metodeDonasiId === m.id).reduce((sum, d) => sum + d.nominal, 0);
          const keluar = pengeluaran.filter(p => p.sumberDanaId === m.id).reduce((sum, p) => sum + p.nominal, 0);
          return (
            <div key={m.id} className="stat-card">
              <div className="stat-icon green"><Wallet size={20} /></div>
              <div className="stat-label">{m.nama}</div>
              <div className="stat-value" style={{ fontSize: '1.25rem', color: s > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                {formatRupiah(s)}
              </div>
              <div className="flex gap-md mt-sm" style={{ fontSize: '0.75rem' }}>
                <span className="text-success">+{formatRupiah(masuk)}</span>
                <span className="text-danger">-{formatRupiah(keluar)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mutation Timeline */}
      <h3 className="font-semibold mb-md">Riwayat Mutasi</h3>
      <div className="stagger">
        {mutations.map(m => (
          <div key={m.id} className="list-item">
            <div className="list-item-avatar" style={{
              background: m.type === 'masuk' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)',
            }}>
              {m.type === 'masuk' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div className="list-item-content">
              <div className="list-item-title">{m.keterangan}</div>
              <div className="list-item-subtitle">{m.metode} · {formatTanggalShort(m.tanggal)}</div>
            </div>
            <div className="list-item-trailing">
              <div className="font-bold" style={{ color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)' }}>
                {m.type === 'masuk' ? '+' : '-'}{formatRupiah(m.nominal)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
