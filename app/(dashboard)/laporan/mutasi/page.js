'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export default function MutasiSaldoPage() {
  const { donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, getSaldoPerMetode } = useData();
  const router = useRouter();
  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

  const mutations = useMemo(() => {
    const items = [];
    donasi.filter(d => d.status === 'terverifikasi').forEach(d => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
      items.push({
        id: d.id, tanggal: d.tanggal, type: 'masuk', nominal: d.nominal,
        metode: met?.nama || '-', metodeId: d.metodeDonasiId,
        keterangan: `${don?.nama || '-'} - ${kat?.nama || '-'}`,
      });
    });
    pengeluaran.forEach(p => {
      const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      items.push({
        id: p.id, tanggal: p.tanggal, type: 'keluar', nominal: p.nominal,
        metode: met?.nama || '-', metodeId: p.sumberDanaId,
        keterangan: `${pos?.nama || '-'}${p.keterangan ? ' - ' + p.keterangan : ''}`,
      });
    });
    return items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran]);

  // Build running balance
  const mutationsWithBalance = useMemo(() => {
    const sorted = [...mutations].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    let runningTotal = 0;
    const withBalance = sorted.map(m => {
      runningTotal += m.type === 'masuk' ? m.nominal : -m.nominal;
      return { ...m, balance: runningTotal };
    });
    return withBalance.reverse();
  }, [mutations]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Mutasi Saldo</h1>
        <p>Timeline seluruh transaksi masuk & keluar</p>
      </div>

      {/* Current Saldo */}
      <div className="grid gap-sm mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {metodeDonasi.filter(m => m.aktif).map(m => (
          <div key={m.id} className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="flex items-center gap-sm mb-sm">
              <Wallet size={14} color="var(--text-secondary)" />
              <span className="text-sm text-secondary">{m.nama}</span>
            </div>
            <div className="font-bold" style={{ color: (saldo[m.id] || 0) > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
              {formatRupiah(saldo[m.id] || 0)}
            </div>
          </div>
        ))}
      </div>

      {/* Mutation Timeline */}
      <div className="stagger">
        {mutationsWithBalance.map(m => (
          <div key={m.id} className="list-item">
            <div className="list-item-avatar" style={{
              background: m.type === 'masuk' ? 'var(--success-bg)' : 'var(--danger-bg)',
              color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)',
            }}>
              {m.type === 'masuk' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
            </div>
            <div className="list-item-content">
              <div className="list-item-title text-sm">{m.keterangan}</div>
              <div className="list-item-subtitle">{m.metode} · {formatTanggalShort(m.tanggal)}</div>
            </div>
            <div className="list-item-trailing">
              <div className="font-bold text-sm" style={{ color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)' }}>
                {m.type === 'masuk' ? '+' : '-'}{formatRupiah(m.nominal)}
              </div>
              <div className="list-item-meta">Saldo: {formatRupiah(m.balance)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
