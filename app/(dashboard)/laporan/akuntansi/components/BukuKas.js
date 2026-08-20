'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { ArrowUpRight, ArrowDownRight, BookOpen, Wallet } from 'lucide-react';

export function BukuKas() {
  const { user } = useAuth();
  const { donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, getSaldoPerMetode } = useData();
  const [filterSumber, setFilterSumber] = useState('semua');

  if (!hasPermission(user, 'laporan.buku_kas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

  const mutations = useMemo(() => {
    const items = [];

    // Verified donations as income
    donasi.filter(d => d.status === 'terverifikasi').forEach(d => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
      items.push({
        id: d.id, tanggal: d.tanggal, type: 'masuk', nominal: d.nominal,
        metode: met?.nama || '-', metodeId: d.metodeDonasiId,
        keterangan: `${don?.nama || '-'} — ${kat?.nama || '-'}`,
      });
    });

    // Expenses as outflow
    pengeluaran.forEach(p => {
      const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      items.push({
        id: p.id, tanggal: p.tanggal, type: 'keluar', nominal: p.nominal,
        metode: met?.nama || '-', metodeId: p.sumberDanaId,
        keterangan: `${pos?.nama || '-'}${p.keterangan ? ' — ' + p.keterangan : ''}`,
      });
    });

    // Filter by sumber dana
    const filtered = filterSumber === 'semua' 
      ? items 
      : items.filter(i => i.metodeId === filterSumber);

    return filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, filterSumber]);

  // Build running balance
  const mutationsWithBalance = useMemo(() => {
    const sorted = [...mutations].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    let runningTotal = 0;
    const withBalance = sorted.map(m => {
      runningTotal += m.type === 'masuk' ? m.nominal : -m.nominal;
      return { ...m, balance: Math.max(0, runningTotal) };
    });
    return withBalance.reverse();
  }, [mutations]);

  const totalMasuk = mutations.filter(m => m.type === 'masuk').reduce((s, m) => s + m.nominal, 0);
  const totalKeluar = mutations.filter(m => m.type === 'keluar').reduce((s, m) => s + m.nominal, 0);

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Saldo per Sumber Dana */}
      <div className="grid gap-sm mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {metodeDonasi.filter(m => m.aktif).map(m => (
          <div 
            key={m.id} 
            className="card cursor-pointer" 
            onClick={() => setFilterSumber(filterSumber === m.id ? 'semua' : m.id)}
            style={{ 
              padding: 'var(--space-md)',
              border: filterSumber === m.id ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex items-center gap-sm mb-sm">
              <Wallet size={14} color="var(--text-secondary)" />
              <span className="text-sm text-secondary">{m.nama}</span>
            </div>
            <div className="font-bold" style={{ color: (saldo[m.id] || 0) > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
              {formatRupiah(saldo[m.id] || 0)}
            </div>
            {filterSumber === m.id && (
              <div className="text-xs mt-xs" style={{ color: 'var(--primary)' }}>● Sedang difilter</div>
            )}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div>
            <div className="text-sm text-secondary">Total Masuk</div>
            <div className="font-bold text-lg" style={{ color: 'var(--success)' }}>+{formatRupiah(totalMasuk)}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Total Keluar</div>
            <div className="font-bold text-lg" style={{ color: 'var(--danger)' }}>-{formatRupiah(totalKeluar)}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Saldo Akhir</div>
            <div className="font-bold text-lg text-primary-color">{formatRupiah(Math.max(0, totalMasuk - totalKeluar))}</div>
          </div>
        </div>
      </div>

      {filterSumber !== 'semua' && (
        <div className="mb-md">
          <button className="btn btn-ghost text-sm" onClick={() => setFilterSumber('semua')}>
            ✕ Hapus filter sumber dana
          </button>
        </div>
      )}

      {/* Mutation Timeline */}
      <div className="stagger">
        {mutationsWithBalance.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Belum Ada Mutasi</h3>
            <p>Belum ada transaksi yang tercatat.</p>
          </div>
        ) : (
          mutationsWithBalance.map(m => (
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
          ))
        )}
      </div>
    </div>
  );
}
