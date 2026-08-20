'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Filter, Search, Download, Printer } from 'lucide-react';

export function DataDonatur() {
  const { user } = useAuth();
  const { donatur, users } = useData();
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');

  const isPetugas = user?.role === 'petugas';

  const filtered = useMemo(() => {
    return donatur.filter(d => {
      // Petugas only sees own donatur
      if (isPetugas && d.createdBy !== user?.id) return false;
      
      const matchSearch = d.nama.toLowerCase().includes(search.toLowerCase()) ||
        d.noWa.includes(search) ||
        d.kota.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'semua' || d.kategori === filterKategori;
      
      return matchSearch && matchKategori;
    });
  }, [donatur, search, filterKategori, isPetugas, user]);

  const handleExport = () => {
    const headers = ['No', 'Nama Donatur', 'No WA', 'Kota', 'Kategori', 'Petugas'];
    const csvData = filtered.map((d, i) => {
      const petugas = users.find(u => u.id === d.createdBy);
      return [
        i + 1,
        `"${d.nama}"`,
        `"${d.noWa}"`,
        `"${d.kota}"`,
        `"${d.kategori}"`,
        `"${petugas?.name || '-'}"`
      ].join(',');
    });
    
    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Data_Donatur_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Header & Export */}
      <div className="flex justify-between items-center mb-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="text-lg font-bold m-0" style={{ margin: 0 }}>List Data Donatur</h3>
        <div className="flex items-center gap-sm" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary flex items-center gap-xs" onClick={handleExportPDF} style={{ color: 'var(--text)' }}>
            <Printer size={16} /> Export PDF
          </button>
          <button className="btn btn-primary flex items-center gap-xs" onClick={handleExport}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-md" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Filter size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Filter & Cari</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <select className="form-select" value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)}>
              <option value="semua">Semua Kategori</option>
              <option value="Keluarga">Keluarga</option>
              <option value="Non Keluarga">Non Keluarga</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 'var(--space-sm)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Cari nama, no WA, kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Donatur</th>
              <th>No WA</th>
              <th>Kota</th>
              <th>Kategori</th>
              <th>Petugas</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary" style={{ padding: '32px' }}>
                  Tidak ada data donatur.
                </td>
              </tr>
            ) : (
              filtered.map((d, idx) => {
                const petugas = users.find(u => u.id === d.createdBy);
                return (
                  <tr key={d.id}>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Nama Donatur" className="font-semibold">{d.nama}</td>
                    <td data-label="No WA">{d.noWa}</td>
                    <td data-label="Kota">{d.kota}</td>
                    <td data-label="Kategori">
                      <span className={`badge ${d.kategori === 'Keluarga' ? 'badge-primary' : 'badge-neutral'}`}>
                        {d.kategori}
                      </span>
                    </td>
                    <td data-label="Petugas">{petugas?.name || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
