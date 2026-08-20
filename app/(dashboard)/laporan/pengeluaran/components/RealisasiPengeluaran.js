'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { Filter } from 'lucide-react';

export function RealisasiPengeluaran() {
  const { user } = useAuth();
  const { pengeluaran, metodeDonasi, posPengeluaran, users } = useData();
  const [filterPos, setFilterPos] = useState('semua');
  const [filterSumber, setFilterSumber] = useState('semua');
  const [filterBulan, setFilterBulan] = useState('semua');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  if (!hasPermission(user, 'laporan.realisasi_pengeluaran')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const bulanOptions = [
    { value: '0', label: 'Januari' }, { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' }, { value: '3', label: 'April' },
    { value: '4', label: 'Mei' }, { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' }, { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' }, { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' }, { value: '11', label: 'Desember' },
  ];

  const availableYears = useMemo(() => {
    const years = new Set(pengeluaran.map(p => new Date(p.tanggal).getFullYear()));
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [pengeluaran]);

  const filtered = useMemo(() => {
    return pengeluaran
      .filter(p => {
        const date = new Date(p.tanggal);
        if (filterTahun !== 'semua' && date.getFullYear().toString() !== filterTahun) return false;
        if (filterBulan !== 'semua' && date.getMonth().toString() !== filterBulan) return false;
        if (filterPos !== 'semua' && p.posPengeluaranId !== filterPos) return false;
        if (filterSumber !== 'semua' && p.sumberDanaId !== filterSumber) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [pengeluaran, filterTahun, filterBulan, filterPos, filterSumber]);

  const totalFiltered = filtered.reduce((sum, p) => sum + p.nominal, 0);

  // Group by Pos Pengeluaran
  const summaryByPos = useMemo(() => {
    const groups = {};
    filtered.forEach(p => {
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      const key = pos?.nama || 'Lainnya';
      const id = p.posPengeluaranId;
      if (!groups[id]) groups[id] = { nama: key, count: 0, total: 0 };
      groups[id].count++;
      groups[id].total += p.nominal;
    });
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [filtered, posPengeluaran]);

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Summary Card */}
      <div className="card mb-lg" style={{ borderLeft: '4px solid var(--danger)' }}>
        <div className="text-sm text-secondary">Total Pengeluaran</div>
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
            <select className="form-select" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              <option value="semua">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
              <option value="semua">Semua Bulan</option>
              {bulanOptions.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
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
              <option value="semua">Semua Sumber Dana</option>
              {metodeDonasi.filter(m => m.aktif).map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary per Pos */}
      {summaryByPos.length > 0 && (
        <div className="mb-lg">
          <h3 className="font-semibold mb-md text-sm">Ringkasan per Pos Pengeluaran</h3>
          <div className="grid gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {summaryByPos.map((item) => {
              const persen = totalFiltered > 0 ? Math.round((item.total / totalFiltered) * 100) : 0;
              return (
                <div key={item.nama} className="card" style={{ padding: 'var(--space-md)' }}>
                  <div className="text-sm text-secondary">{item.nama}</div>
                  <div className="font-bold" style={{ color: 'var(--danger)' }}>{formatRupiah(item.total)}</div>
                  <div className="text-sm text-tertiary">{item.count} transaksi · {persen}%</div>
                  <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--bg-secondary)', marginTop: '8px' }}>
                    <div style={{ width: `${persen}%`, height: '100%', borderRadius: '2px', background: 'var(--danger)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Pos Pengeluaran</th>
              <th>Sumber Dana</th>
              <th>Keterangan</th>
              <th className="text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary" style={{ padding: '32px' }}>
                  Tidak ada data untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => {
                const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
                const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
                return (
                  <tr key={p.id}>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Tanggal">{formatTanggalShort(p.tanggal)}</td>
                    <td data-label="Pos"><span className="badge badge-danger">{pos?.nama || '-'}</span></td>
                    <td data-label="Sumber">{met?.nama || '-'}</td>
                    <td data-label="Keterangan" className="text-sm">{p.keterangan || '-'}</td>
                    <td data-label="Nominal" className="text-right font-semibold" style={{ color: 'var(--danger)' }}>-{formatRupiah(p.nominal)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} className="font-bold text-right">Total</td>
                <td className="text-right font-bold" style={{ color: 'var(--danger)' }}>-{formatRupiah(totalFiltered)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
