'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { BarChart3, Filter, Download, TrendingUp } from 'lucide-react';

export default function LaporanDonasiPage() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, users } = useData();
  const [filterPeriode, setFilterPeriode] = useState('semua');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [filterMetode, setFilterMetode] = useState('semua');

  const filtered = useMemo(() => {
    return donasi
      .filter(d => d.status === 'terverifikasi')
      .filter(d => {
        if (filterKategori !== 'semua' && d.kategoriDonasiId !== filterKategori) return false;
        if (filterMetode !== 'semua' && d.metodeDonasiId !== filterMetode) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, filterKategori, filterMetode]);

  const totalFiltered = filtered.reduce((sum, d) => sum + d.nominal, 0);

  // Group by kategori for summary
  const summaryByKategori = useMemo(() => {
    const groups = {};
    filtered.forEach(d => {
      const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
      const key = kat?.nama || 'Lainnya';
      if (!groups[key]) groups[key] = { count: 0, total: 0 };
      groups[key].count++;
      groups[key].total += d.nominal;
    });
    return Object.entries(groups).sort((a, b) => b[1].total - a[1].total);
  }, [filtered, kategoriDonasi]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>Laporan Donasi Masuk</h1>
        <p>Riwayat donasi yang telah terverifikasi</p>
      </div>

      {/* Summary */}
      <div className="saldo-card mb-lg">
        <div className="saldo-label">Total Donasi Terverifikasi</div>
        <div className="saldo-amount">{formatRupiah(totalFiltered)}</div>
        <div className="saldo-detail">
          <span>{filtered.length} transaksi</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Filter size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Filter</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="semua">Semua Kategori</option>
              {kategoriDonasi.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterMetode} onChange={(e) => setFilterMetode(e.target.value)}>
              <option value="semua">Semua Metode</option>
              {metodeDonasi.map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary by Kategori */}
      {summaryByKategori.length > 0 && (
        <div className="mb-lg">
          <h3 className="font-semibold mb-md text-sm">Ringkasan per Kategori</h3>
          <div className="grid gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {summaryByKategori.map(([key, val]) => (
              <div key={key} className="card" style={{ padding: 'var(--space-md)' }}>
                <div className="text-sm text-secondary">{key}</div>
                <div className="font-bold text-primary-color">{formatRupiah(val.total)}</div>
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
              <th>Donatur</th>
              <th>Kategori</th>
              <th>Metode</th>
              <th>Petugas</th>
              <th className="text-right">Nominal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => {
              const don = donatur.find(x => x.id === d.donaturId);
              const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
              const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
              const pet = users.find(u => u.id === d.petugasId);
              return (
                <tr key={d.id}>
                  <td data-label="Tanggal">{formatTanggalShort(d.tanggal)}</td>
                  <td data-label="Donatur">{don?.nama || '-'}</td>
                  <td data-label="Kategori"><span className="badge badge-primary">{kat?.nama || '-'}</span></td>
                  <td data-label="Metode">{met?.nama || '-'}</td>
                  <td data-label="Petugas">{pet?.name || '-'}</td>
                  <td data-label="Nominal" className="text-right font-semibold text-primary-color">{formatRupiah(d.nominal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
