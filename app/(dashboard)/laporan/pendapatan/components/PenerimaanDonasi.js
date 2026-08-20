'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { Filter, HandCoins, Calendar, Search, Download, Printer } from 'lucide-react';

export function PenerimaanDonasi() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, users } = useData();
  const [filterBulan, setFilterBulan] = useState('semua');
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());
  const [filterSumber, setFilterSumber] = useState('semua');
  const [search, setSearch] = useState('');

  if (!hasPermission(user, 'laporan.penerimaan_donasi')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  // Get available years from data
  const availableYears = useMemo(() => {
    const years = new Set(donasi.map(d => new Date(d.tanggal).getFullYear()));
    return [...years].sort((a, b) => b - a);
  }, [donasi]);

  const bulanOptions = [
    { value: '0', label: 'Januari' }, { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' }, { value: '3', label: 'April' },
    { value: '4', label: 'Mei' }, { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' }, { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' }, { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' }, { value: '11', label: 'Desember' },
  ];

  const filtered = useMemo(() => {
    return donasi
      .filter(d => d.status === 'terverifikasi')
      .filter(d => {
        // Petugas only sees own data
        if (isPetugas && d.petugasId !== user?.id) return false;
        // Period filter
        const date = new Date(d.tanggal);
        if (filterTahun !== 'semua' && date.getFullYear().toString() !== filterTahun) return false;
        if (filterBulan !== 'semua' && date.getMonth().toString() !== filterBulan) return false;
        // Sumber dana filter
        if (filterSumber !== 'semua' && d.metodeDonasiId !== filterSumber) return false;
        // Search
        if (search) {
          const don = donatur.find(x => x.id === d.donaturId);
          if (!don?.nama.toLowerCase().includes(search.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, donatur, isPetugas, user, filterTahun, filterBulan, filterSumber, search]);

  const totalFiltered = filtered.reduce((sum, d) => sum + d.nominal, 0);

  const handleExport = () => {
    const headers = ['No', 'Tanggal', 'Nama Donatur', 'Nominal', 'Sumber Dana', 'Petugas'];
    const csvData = filtered.map((d, i) => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const pet = users.find(u => u.id === d.petugasId);
      
      return [
        i + 1,
        `"${formatTanggalShort(d.tanggal)}"`,
        `"${don?.nama || '-'}"`,
        d.nominal,
        `"${met?.nama || '-'}"`,
        `"${pet?.name || '-'}"`
      ].join(',');
    });
    
    // Add total row
    csvData.push(`"","","Total",${totalFiltered},"",""`);
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Penerimaan_Donasi_${filterBulan}_${filterTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="flex justify-end gap-sm mb-md" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-secondary flex items-center gap-xs" onClick={handleExportPDF} style={{ color: 'var(--text)' }}>
          <Printer size={16} /> Export PDF
        </button>
        <button className="btn btn-primary flex items-center gap-xs" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>
      {/* Summary */}
      <div className="saldo-card mb-lg">
        <div className="saldo-label">Total Penerimaan Donasi</div>
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
            <select className="form-select" value={filterSumber} onChange={(e) => setFilterSumber(e.target.value)}>
              <option value="semua">Semua Sumber Dana</option>
              {metodeDonasi.filter(m => m.aktif).map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Cari nama donatur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Nama Donatur</th>
              <th>Nominal</th>
              <th>Sumber Dana</th>
              <th>Petugas</th>
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
              filtered.map((d, idx) => {
                const don = donatur.find(x => x.id === d.donaturId);
                const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
                const pet = users.find(u => u.id === d.petugasId);
                return (
                  <tr key={d.id}>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Tanggal">{formatTanggalShort(d.tanggal)}</td>
                    <td data-label="Donatur" className="font-semibold">{don?.nama || '-'}</td>
                    <td data-label="Nominal" className="font-semibold text-primary-color">{formatRupiah(d.nominal)}</td>
                    <td data-label="Sumber Dana">
                      <span className="badge badge-primary">{met?.nama || '-'}</span>
                    </td>
                    <td data-label="Petugas">{pet?.name || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3} className="font-bold text-right">Total</td>
                <td className="font-bold text-primary-color">{formatRupiah(totalFiltered)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
