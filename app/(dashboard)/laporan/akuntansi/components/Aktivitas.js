'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

export function Aktivitas() {
  const { user } = useAuth();
  const { donasi, pengeluaran } = useData();
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  if (!hasPermission(user, 'laporan.aktivitas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const availableYears = useMemo(() => {
    const years = new Set([
      ...donasi.map(d => new Date(d.tanggal).getFullYear()),
      ...pengeluaran.map(p => new Date(p.tanggal).getFullYear()),
    ]);
    years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [donasi, pengeluaran]);

  const bulanLabels = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const monthlyData = useMemo(() => {
    const tahun = parseInt(filterTahun);
    
    return bulanLabels.map((label, bulanIdx) => {
      // Penerimaan (verified donations)
      const penerimaan = donasi
        .filter(d => d.status === 'terverifikasi')
        .filter(d => {
          const date = new Date(d.tanggal);
          return date.getFullYear() === tahun && date.getMonth() === bulanIdx;
        })
        .reduce((sum, d) => sum + d.nominal, 0);

      // Pengeluaran
      const pengeluaranBulan = pengeluaran
        .filter(p => {
          const date = new Date(p.tanggal);
          return date.getFullYear() === tahun && date.getMonth() === bulanIdx;
        })
        .reduce((sum, p) => sum + p.nominal, 0);

      const selisih = penerimaan - pengeluaranBulan;

      return {
        bulan: label,
        bulanIdx,
        penerimaan,
        pengeluaran: pengeluaranBulan,
        selisih,
        status: selisih > 0 ? 'surplus' : selisih < 0 ? 'defisit' : 'netral',
      };
    });
  }, [donasi, pengeluaran, filterTahun]);

  // Only show months that have data or up to current month
  const activeMonths = useMemo(() => {
    const tahun = parseInt(filterTahun);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    return monthlyData.filter(m => {
      if (tahun < currentYear) return true; // past years show all months
      return m.bulanIdx <= currentMonth; // current year show up to current month
    });
  }, [monthlyData, filterTahun]);

  const totals = useMemo(() => {
    return activeMonths.reduce((acc, m) => ({
      penerimaan: acc.penerimaan + m.penerimaan,
      pengeluaran: acc.pengeluaran + m.pengeluaran,
      selisih: acc.selisih + m.selisih,
    }), { penerimaan: 0, pengeluaran: 0, selisih: 0 });
  }, [activeMonths]);

  // Find max for bar chart scaling
  const maxValue = useMemo(() => {
    return Math.max(...activeMonths.map(m => Math.max(m.penerimaan, m.pengeluaran)), 1);
  }, [activeMonths]);

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Year filter */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Calendar size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Periode Tahun</span>
        </div>
        <div className="form-group" style={{ marginBottom: 0, maxWidth: '200px' }}>
          <select className="form-select" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Annual Summary */}
      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="text-sm text-secondary mb-xs">Total Penerimaan</div>
          <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>+{formatRupiah(totals.penerimaan)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="text-sm text-secondary mb-xs">Total Pengeluaran</div>
          <div className="text-xl font-bold" style={{ color: 'var(--danger)' }}>-{formatRupiah(totals.pengeluaran)}</div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${totals.selisih >= 0 ? 'var(--success)' : 'var(--danger)'}` }}>
          <div className="text-sm text-secondary mb-xs">
            {totals.selisih >= 0 ? 'Surplus' : 'Defisit'} Tahunan
          </div>
          <div className="text-xl font-bold flex items-center gap-xs" style={{ color: totals.selisih >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            {totals.selisih >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            {formatRupiah(Math.abs(totals.selisih))}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="card mb-lg" style={{ padding: 'var(--space-lg)' }}>
        <h3 className="font-bold mb-lg">Grafik Penerimaan vs Pengeluaran per Bulan</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeMonths.map(m => (
            <div key={m.bulanIdx}>
              <div className="flex items-center justify-between mb-xs">
                <span className="text-sm font-semibold" style={{ minWidth: '80px' }}>{m.bulan.substring(0, 3)}</span>
                <div className="flex items-center gap-sm text-xs">
                  <span style={{ color: m.selisih >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                    {m.selisih >= 0 ? '▲ Surplus' : '▼ Defisit'} {formatRupiah(Math.abs(m.selisih))}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {/* Penerimaan bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    height: '14px', 
                    width: `${Math.max(2, (m.penerimaan / maxValue) * 100)}%`,
                    background: 'var(--success)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                    minWidth: m.penerimaan > 0 ? '2px' : 0,
                  }} />
                  {m.penerimaan > 0 && <span className="text-xs text-secondary">{formatRupiah(m.penerimaan)}</span>}
                </div>
                {/* Pengeluaran bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    height: '14px', 
                    width: `${Math.max(2, (m.pengeluaran / maxValue) * 100)}%`,
                    background: 'var(--danger)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease',
                    minWidth: m.pengeluaran > 0 ? '2px' : 0,
                  }} />
                  {m.pengeluaran > 0 && <span className="text-xs text-secondary">{formatRupiah(m.pengeluaran)}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-lg mt-lg text-sm">
          <div className="flex items-center gap-xs">
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--success)' }} />
            <span className="text-secondary">Penerimaan</span>
          </div>
          <div className="flex items-center gap-xs">
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: 'var(--danger)' }} />
            <span className="text-secondary">Pengeluaran</span>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>Bulan</th>
              <th className="text-right">Penerimaan</th>
              <th className="text-right">Pengeluaran</th>
              <th className="text-right">Selisih</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {activeMonths.map(m => (
              <tr key={m.bulanIdx}>
                <td data-label="Bulan" className="font-semibold">{m.bulan}</td>
                <td data-label="Penerimaan" className="text-right" style={{ color: 'var(--success)' }}>
                  {m.penerimaan > 0 ? `+${formatRupiah(m.penerimaan)}` : '-'}
                </td>
                <td data-label="Pengeluaran" className="text-right" style={{ color: 'var(--danger)' }}>
                  {m.pengeluaran > 0 ? `-${formatRupiah(m.pengeluaran)}` : '-'}
                </td>
                <td data-label="Selisih" className="text-right font-bold" style={{ color: m.selisih >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {m.penerimaan === 0 && m.pengeluaran === 0 ? '-' : formatRupiah(m.selisih)}
                </td>
                <td data-label="Status">
                  {m.penerimaan === 0 && m.pengeluaran === 0 ? (
                    <span className="badge badge-neutral">-</span>
                  ) : m.selisih > 0 ? (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={12} /> Surplus
                    </span>
                  ) : m.selisih < 0 ? (
                    <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={12} /> Defisit
                    </span>
                  ) : (
                    <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Minus size={12} /> Netral
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '2px solid var(--border)' }}>
              <td className="font-bold">Total {filterTahun}</td>
              <td className="text-right font-bold" style={{ color: 'var(--success)' }}>+{formatRupiah(totals.penerimaan)}</td>
              <td className="text-right font-bold" style={{ color: 'var(--danger)' }}>-{formatRupiah(totals.pengeluaran)}</td>
              <td className="text-right font-bold" style={{ color: totals.selisih >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {formatRupiah(totals.selisih)}
              </td>
              <td>
                <span className={`badge badge-${totals.selisih >= 0 ? 'success' : 'danger'}`}>
                  {totals.selisih >= 0 ? 'Surplus' : 'Defisit'}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
