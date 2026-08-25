'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalDDMMYYYY, getStatusBadge } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Kolektabilitas() {
  const { user } = useAuth();
  const { donasi, donatur, users } = useData();
  const now = new Date();
  const [filterBulan, setFilterBulan] = useState('semua');
  const [filterTahun, setFilterTahun] = useState('semua');

  if (!hasPermission(user, 'laporan.kolektabilitas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  const bulanOptions = [
    { value: '0', label: 'Januari' }, { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' }, { value: '3', label: 'April' },
    { value: '4', label: 'Mei' }, { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' }, { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' }, { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' }, { value: '11', label: 'Desember' },
  ];

  const availableYears = useMemo(() => {
    const years = new Set(donasi.map(d => new Date(d.tanggal).getFullYear()));
    years.add(now.getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [donasi]);

  const kolektabilitas = useMemo(() => {
    // Get relevant donatur list
    let donaturList = donatur;
    if (isPetugas) {
      donaturList = donatur.filter(d => d.createdBy === user?.id);
    }

    const filterBulanInt = filterBulan !== 'semua' ? parseInt(filterBulan) : null;
    const filterTahunInt = filterTahun !== 'semua' ? parseInt(filterTahun) : null;

    return donaturList.map(d => {
      // Find donations from this donatur in the selected period (or all if 'semua')
      const donasiDonatur = donasi.filter(dn => {
        const date = new Date(dn.tanggal);
        const monthMatch = filterBulanInt === null || date.getMonth() === filterBulanInt;
        const yearMatch = filterTahunInt === null || date.getFullYear() === filterTahunInt;
        return dn.donaturId === d.id && monthMatch && yearMatch;
      });

      const totalDonasi = donasiDonatur.reduce((sum, dn) => sum + dn.nominal, 0);
      const sudahDonasi = donasiDonatur.length > 0;
      const petugas = users.find(u => u.id === d.createdBy);
      const lastDonasi = donasiDonatur.length > 0 
        ? donasiDonatur.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0]
        : null;

      return {
        ...d,
        sudahDonasi,
        totalDonasi,
        jumlahDonasi: donasiDonatur.length,
        petugasNama: petugas?.name || '-',
        lastDonasiTanggal: lastDonasi?.tanggal || null,
      };
    }).sort((a, b) => {
      // Sort: belum donasi first, then by name
      if (a.sudahDonasi !== b.sudahDonasi) return a.sudahDonasi ? 1 : -1;
      return a.nama.localeCompare(b.nama);
    });
  }, [donatur, donasi, users, isPetugas, user, filterBulan, filterTahun]);

  const sudahCount = kolektabilitas.filter(d => d.sudahDonasi).length;
  const belumCount = kolektabilitas.filter(d => !d.sudahDonasi).length;
  const totalAmount = kolektabilitas.reduce((sum, d) => sum + d.totalDonasi, 0);
  const persen = kolektabilitas.length > 0 ? Math.round((sudahCount / kolektabilitas.length) * 100) : 0;

  const getPeriodeString = () => {
    let periodeStr = 'Semua Periode';
    if (filterBulan !== 'semua' && filterTahun !== 'semua') {
      const bulanLabel = bulanOptions.find(b => b.value === filterBulan)?.label;
      periodeStr = `${bulanLabel} ${filterTahun}`;
    } else if (filterTahun !== 'semua') {
      periodeStr = `Tahun ${filterTahun}`;
    } else if (filterBulan !== 'semua') {
      const bulanLabel = bulanOptions.find(b => b.value === filterBulan)?.label;
      periodeStr = `Bulan ${bulanLabel}`;
    }
    return periodeStr.toUpperCase();
  };

  const getExportFileName = () => {
    let periodeStr = 'Semua Periode';
    if (filterBulan !== 'semua' && filterTahun !== 'semua') {
      const bulanLabel = bulanOptions.find(b => b.value === filterBulan)?.label;
      periodeStr = `${filterTahun} ${bulanLabel}`;
    } else if (filterTahun !== 'semua') {
      periodeStr = `${filterTahun}`;
    } else if (filterBulan !== 'semua') {
      const bulanLabel = bulanOptions.find(b => b.value === filterBulan)?.label;
      periodeStr = `${bulanLabel}`;
    }
    return `Kolektabilitas Periode ${periodeStr}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Nama Donatur', 'Petugas', 'Status', 'Jumlah Donasi', 'Total Nominal', 'Terakhir Donasi'];
    const csvData = kolektabilitas.map((d, i) => {
      return [
        i + 1,
        `"${d.nama}"`,
        `"${d.petugasNama}"`,
        d.sudahDonasi ? 'Sudah Didata' : 'Belum Didata',
        d.jumlahDonasi,
        d.totalDonasi,
        d.lastDonasiTanggal ? `"${formatTanggalDDMMYYYY(d.lastDonasiTanggal)}"` : '-'
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
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    const periodeStr = getPeriodeString();
    
    const headers = [['NO', 'NAMA DONATUR', 'PETUGAS', 'STATUS', 'JUMLAH DONASI', 'TOTAL NOMINAL', 'TERAKHIR DONASI']];
    const data = kolektabilitas.map((d, i) => {
      return [
        i + 1,
        d.nama,
        d.petugasNama,
        d.sudahDonasi ? 'Sudah Didata' : 'Belum Didata',
        d.jumlahDonasi,
        formatRupiah(d.totalDonasi),
        d.lastDonasiTanggal ? formatTanggalDDMMYYYY(d.lastDonasiTanggal) : '-'
      ];
    });
    
    // Add total row
    data.push([
      { content: 'TOTAL', colSpan: 5, styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(totalAmount), styles: { fontStyle: 'bold', halign: 'right' } }, 
      ''
    ]);
    
    const totalPagesExp = '{total_pages_count_string}';

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 91,
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
        lineWidth: 0.1 
      },
      columnStyles: {
        4: { halign: 'center' },
        5: { halign: 'right' },
        6: { halign: 'center' }
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
          doc.text('LAPORAN KOLEKTABILITAS', pageWidth / 2, 40, { align: 'center' });
          doc.text(`PERIODE: ${periodeStr}`, pageWidth / 2, 46, { align: 'center' });
          
          // Summary Boxes
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          
          const lx = 14;
          const rx = 100;
          const w1 = 30;
          const w2 = 5;
          const w3 = 30;
          const rh = 7;
          const y1 = 55;
          const y2 = 64;
          const y3 = 71;

          doc.setLineWidth(0.2);

          // Left Row 1
          doc.rect(lx, y1, w1, rh); doc.text('Total Donatur', lx + 2, y1 + 5);
          doc.rect(lx+w1, y1, w2, rh); doc.text(':', lx+w1 + 1.5, y1 + 5);
          doc.rect(lx+w1+w2, y1, w3, rh); doc.text(`${kolektabilitas.length}`, lx+w1+w2 + 2, y1 + 5);

          // Right Row 1
          doc.rect(rx, y1, w1, rh); doc.text('Kolektabilitas', rx + 2, y1 + 5);
          doc.rect(rx+w1, y1, w2, rh); doc.text(':', rx+w1 + 1.5, y1 + 5);
          doc.rect(rx+w1+w2, y1, w3, rh); doc.text(`${persen}%`, rx+w1+w2 + 2, y1 + 5);

          // Left Row 2
          doc.rect(lx, y2, w1, rh); doc.text('Sudah Didata', lx + 2, y2 + 5);
          doc.rect(lx+w1, y2, w2+w3, rh); doc.text(`${sudahCount}`, lx+w1 + 2, y2 + 5);

          // Right Row 2
          doc.rect(rx, y2, w1+w2+w3, rh); doc.text('Total Terkumpul', rx + (w1+w2+w3)/2, y2 + 5, { align: 'center' });

          // Left Row 3
          doc.rect(lx, y3, w1, rh); doc.text('Belum Didata', lx + 2, y3 + 5);
          doc.rect(lx+w1, y3, w2+w3, rh); doc.text(`${belumCount}`, lx+w1 + 2, y3 + 5);

          // Right Row 3
          doc.rect(rx, y3, w1+w2+w3, rh); doc.text(`${formatRupiah(totalAmount)}`, rx + (w1+w2+w3)/2, y3 + 5, { align: 'center' });
          
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(150, 150, 150);
          
          let tahunStr = filterTahun !== 'semua' ? filterTahun : 'Semua Tahun';
          let bulanStr = filterBulan !== 'semua' ? bulanOptions.find(b => b.value === filterBulan)?.label : 'Semua Bulan';
          
          doc.text(`TAHUN: ${tahunStr.toUpperCase()}`, 14, 15);
          doc.text(`BULAN: ${bulanStr.toUpperCase()}`, 14, 20);
          
          doc.setLineWidth(0.5);
          doc.setDrawColor(150, 150, 150);
          doc.line(14, 23, pageWidth - 14, 23);
          
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
        
        doc.text('LAPORAN KOLEKTABILITAS', 14, pageHeight - 10);
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
      <div className="flex justify-end gap-sm mb-md" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-secondary flex items-center gap-xs" onClick={handleExportPDF} style={{ color: 'var(--text)' }}>
          <Printer size={16} /> Export PDF
        </button>
        <button className="btn btn-primary flex items-center gap-xs" onClick={handleExport}>
          <Download size={16} /> Export CSV
        </button>
      </div>
      {/* Filters */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Calendar size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Periode</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-select" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              <option value="semua">Semua Tahun</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-select" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
              <option value="semua">Semua Bulan</option>
              {bulanOptions.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="text-sm text-secondary mb-xs">Total Donatur</div>
          <div className="text-2xl font-bold">{kolektabilitas.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="text-sm text-secondary mb-xs">Sudah Didata</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{sudahCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="text-sm text-secondary mb-xs">Belum Didata</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{belumCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="text-sm text-secondary mb-xs">Kolektabilitas</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>{persen}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center justify-between mb-sm">
          <span className="text-sm font-semibold">Tingkat Kolektabilitas</span>
          <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{persen}%</span>
        </div>
        <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{ width: `${persen}%`, height: '100%', borderRadius: '5px', background: persen >= 75 ? 'var(--success)' : persen >= 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.5s ease' }} />
        </div>
        <div className="text-sm text-tertiary mt-sm">Total terkumpul: {formatRupiah(totalAmount)}</div>
      </div>

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Donatur</th>
              <th>Petugas</th>
              <th>Status</th>
              <th>Jumlah Donasi</th>
              <th className="text-right">Total Nominal</th>
              <th>Terakhir Donasi</th>
            </tr>
          </thead>
          <tbody>
            {kolektabilitas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary" style={{ padding: '32px' }}>
                  Tidak ada data donatur.
                </td>
              </tr>
            ) : (
              kolektabilitas.map((d, idx) => (
                <tr key={d.id}>
                  <td data-label="No">{idx + 1}</td>
                  <td data-label="Donatur" className="font-semibold">{d.nama}</td>
                  <td data-label="Petugas">{d.petugasNama}</td>
                  <td data-label="Status">
                    {d.sudahDonasi ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Sudah Didata
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> Belum Didata
                      </span>
                    )}
                  </td>
                  <td data-label="Jumlah">{d.jumlahDonasi}x</td>
                  <td data-label="Nominal" className="text-right font-semibold text-primary-color">
                    {d.totalDonasi > 0 ? formatRupiah(d.totalDonasi) : '-'}
                  </td>
                  <td data-label="Terakhir">{d.lastDonasiTanggal ? formatTanggalDDMMYYYY(d.lastDonasiTanggal) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
