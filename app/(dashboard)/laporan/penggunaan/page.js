'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, Filter, Minus } from 'lucide-react';

export default function LaporanPenggunaanPage() {
  const { pengeluaran, metodeDonasi, posPengeluaran } = useData();
  const router = useRouter();
  const [filterPos, setFilterPos] = useState('semua');
  const [filterSumber, setFilterSumber] = useState('semua');

  const filtered = useMemo(() => {
    return pengeluaran
      .filter(p => {
        if (filterPos !== 'semua' && p.posPengeluaranId !== filterPos) return false;
        if (filterSumber !== 'semua' && p.sumberDanaId !== filterSumber) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [pengeluaran, filterPos, filterSumber]);

  const totalFiltered = filtered.reduce((sum, p) => sum + p.nominal, 0);

  const summaryByPos = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      const key = pos?.nama || 'Lainnya';
      if (!groups[key]) groups[key] = { count: 0, total: 0 };
      groups[key].count++;
      groups[key].total += p.nominal;
    });
    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  }, [filtered, posPengeluaran]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Laporan Penggunaan Dana</h1>
        <p>Rincian penggunaan dana donasi</p>
      </div>

      {/* Summary Card */}
      <div className="card mb-lg" style={{ borderLeft: '3px solid var(--danger)' }}>
        <div className="text-sm text-secondary">Total Penggunaan Dana</div>
        <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{formatRupiah(totalFiltered)}</div>
        <div className="text-sm text-tertiary">{filtered.length} transaksi</div>
      </div>

      {/* Filters */}
      <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Filter size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Filter</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterPos} onChange={(e) => setFilterPos(e.target.value)}>
              <option value="semua">Semua Pos</option>
              {posPengeluaran.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterSumber} onChange={(e) => setFilterSumber(e.target.value)}>
              <option value="semua">Semua Sumber</option>
              {metodeDonasi.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary by Pos */}
      {summaryByPos.length > 0 && (
        <div className="mb-lg">
          <h3 className="font-semibold mb-md text-sm">Ringkasan per Pos Pengeluaran</h3>
          <div className="grid gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {summaryByPos.map(([key, val]) => (
              <div key={key} className="card" style={{ padding: 'var(--space-md)' }}>
                <div className="text-sm text-secondary">{key}</div>
                <div className="font-bold" style={{ color: 'var(--danger)' }}>{formatRupiah(val.total)}</div>
                <div className="text-sm text-tertiary">{val.count} transaksi</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Pos Pengeluaran</th>
              <th>Sumber Dana</th>
              <th>Keterangan</th>
              <th className="text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
              const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
              return (
                <tr key={p.id}>
                  <td data-label="Tanggal">{formatTanggalShort(p.tanggal)}</td>
                  <td data-label="Pos"><span className="badge badge-danger">{pos?.nama || '-'}</span></td>
                  <td data-label="Sumber">{met?.nama || '-'}</td>
                  <td data-label="Keterangan" className="text-sm">{p.keterangan || '-'}</td>
                  <td data-label="Nominal" className="text-right font-semibold" style={{ color: 'var(--danger)' }}>-{formatRupiah(p.nominal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
