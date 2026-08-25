'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Filter, Search, Download, Printer, ChevronUp, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function DataDonatur() {
  const { user } = useAuth();
  const { donatur, users } = useData();
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [sortConfig, setSortConfig] = useState({ key: 'nama', direction: 'asc' });

  const isPetugas = user?.role === 'petugas';

  const filtered = useMemo(() => {
    let result = donatur.filter(d => {
      // Petugas only sees own donatur
      if (isPetugas && d.createdBy !== user?.id) return false;

      const matchSearch = d.nama.toLowerCase().includes(search.toLowerCase()) ||
        d.noWa.includes(search) ||
        d.kota.toLowerCase().includes(search.toLowerCase());
      const matchKategori = filterKategori === 'semua' || d.kategori === filterKategori;

      return matchSearch && matchKategori;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key] || '';
        let bValue = b[sortConfig.key] || '';
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Secondary sort by nama for stable ordering
        let aName = (a.nama || '').toLowerCase();
        let bName = (b.nama || '').toLowerCase();
        if (aName < bName) return -1;
        if (aName > bName) return 1;
        return 0;
      });
    }

    return result;
  }, [donatur, search, filterKategori, isPetugas, user, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom' }} /> : 
      <ChevronDown size={14} style={{ display: 'inline', marginLeft: '4px', verticalAlign: 'text-bottom' }} />;
  };

  const getKategoriString = () => {
    return filterKategori !== 'semua' ? filterKategori.toUpperCase() : 'SEMUA KATEGORI';
  };

  const getExportFileName = () => {
    const katStr = filterKategori !== 'semua' ? filterKategori : 'Semua Kategori';
    return `Data Donatur Kategori ${katStr}`;
  };

  const handleExport = () => {
    const headers = [
      'No', 'Nama Donatur', 'No WA', 'Kategori',
      'Provinsi', 'Kota / Kabupaten', 'Kecamatan', 'Kelurahan / Desa',
      'Alamat', 'Link Google Maps', 'Petugas'
    ];
    const csvData = filtered.map((d, i) => {
      const petugas = users.find(u => u.id === d.createdBy);
      return [
        i + 1,
        `"${d.nama}"`,
        `"${d.noWa}"`,
        `"${d.kategori}"`,
        `"${d.provinsi || '-'}"`,
        `"${d.kota || '-'}"`,
        `"${d.kecamatan || '-'}"`,
        `"${d.kelurahan || '-'}"`,
        `"${d.keterangan || d.alamat || '-'}"`,
        `"${d.linkGmaps || '-'}"`,
        `"${petugas?.name || '-'}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${getExportFileName()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for many columns
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const kategoriStr = getKategoriString();

    const headers = [[
      'NO', 'NAMA DONATUR', 'NO WA', 'KATEGORI',
      'PROVINSI', 'KOTA', 'KECAMATAN', 'KELURAHAN',
      'ALAMAT', 'PETUGAS'
    ]]; // Exclude linkGmaps from PDF to save space
    const data = filtered.map((d, i) => {
      const petugas = users.find(u => u.id === d.createdBy);
      return [
        i + 1,
        d.nama,
        d.noWa,
        d.kategori,
        d.provinsi || '-',
        d.kota || '-',
        d.kecamatan || '-',
        d.kelurahan || '-',
        d.keterangan || d.alamat || '-',
        petugas?.name || '-'
      ];
    });

    // Add total row
    data.push([
      { content: 'TOTAL DONATUR', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
      { content: filtered.length.toString(), colSpan: 7, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);

    const totalPagesExp = '{total_pages_count_string}';

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 55,
      margin: { top: 30, left: 14, right: 14, bottom: 20 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
        valign: 'middle'
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 23 },
        3: { cellWidth: 20 },
        4: { cellWidth: 22 },
        9: { cellWidth: 22 }
      },
      didDrawPage: function (data) {
        if (data.pageNumber === 1) {
          // Header Page 1
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('YAYASAN AR-ROSYAD AL-ISLAMIY', pageWidth / 2, 15, { align: 'center' });

          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text('Jl. Masjid Basyaruddin, RT 21 RW 05, Desa Bogem, Kecamatan Gurah, Kabupaten Kediri, Jawa Timur 64181', pageWidth / 2, 20, { align: 'center' });
          doc.text('Telp/WA: 085259838384 | Website: http://arrosyad.or.id', pageWidth / 2, 25, { align: 'center' });

          // Double line
          doc.setLineWidth(0.5);
          doc.line(14, 28, pageWidth - 14, 28);
          doc.setLineWidth(0.2);
          doc.line(14, 29, pageWidth - 14, 29);

          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('LAPORAN DATA DONATUR', pageWidth / 2, 40, { align: 'center' });
          doc.text(`KATEGORI: ${kategoriStr}`, pageWidth / 2, 46, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(150, 150, 150);
          doc.text(`KATEGORI: ${kategoriStr}`, 14, 15);

          doc.setLineWidth(0.5);
          doc.setDrawColor(150, 150, 150);
          doc.line(14, 18, pageWidth - 14, 18);

          doc.setTextColor(0, 0, 0);
          doc.setDrawColor(0, 0, 0);
        }

        // Footer
        const str = `halaman ${doc.internal.getNumberOfPages()} dari ${totalPagesExp}`;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150, 150, 150);

        doc.setLineWidth(0.1);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

        doc.text('LAPORAN DATA DONATUR', 14, pageHeight - 10);

        const expectedStr = `halaman ${doc.internal.getNumberOfPages()} dari 1`;
        const textWidth = doc.getStringUnitWidth(expectedStr) * doc.internal.getFontSize() / doc.internal.scaleFactor;
        doc.text(str, pageWidth - 14 - textWidth, pageHeight - 10);

        doc.setTextColor(0, 0, 0);
        doc.setDrawColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
      }
    });

    if (typeof doc.putTotalPages === 'function') {
      doc.putTotalPages(totalPagesExp);
    }

    doc.save(`${getExportFileName()}.pdf`);
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
              <th onClick={() => requestSort('nama')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Nama Donatur {getSortIcon('nama')}
              </th>
              <th>No WA</th>
              <th onClick={() => requestSort('kategori')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Kategori {getSortIcon('kategori')}
              </th>
              <th onClick={() => requestSort('provinsi')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Provinsi {getSortIcon('provinsi')}
              </th>
              <th onClick={() => requestSort('kota')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Kota {getSortIcon('kota')}
              </th>
              <th onClick={() => requestSort('kecamatan')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Kecamatan {getSortIcon('kecamatan')}
              </th>
              <th onClick={() => requestSort('kelurahan')} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
                Kelurahan {getSortIcon('kelurahan')}
              </th>
              <th>Alamat</th>
              <th>Link Maps</th>
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
                    <td data-label="Kategori">
                      <span className={`badge ${d.kategori === 'Keluarga' ? 'badge-primary' : 'badge-neutral'}`}>
                        {d.kategori}
                      </span>
                    </td>
                    <td data-label="Provinsi">{d.provinsi || '-'}</td>
                    <td data-label="Kota">{d.kota || '-'}</td>
                    <td data-label="Kecamatan">{d.kecamatan || '-'}</td>
                    <td data-label="Kelurahan">{d.kelurahan || '-'}</td>
                    <td data-label="Alamat">{d.keterangan || d.alamat || '-'}</td>
                    <td data-label="Link Maps">
                      {d.linkGmaps ? (
                        <a href={d.linkGmaps} target="_blank" rel="noreferrer" className="text-primary-color" style={{ textDecoration: 'underline' }}>Buka Map</a>
                      ) : '-'}
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
