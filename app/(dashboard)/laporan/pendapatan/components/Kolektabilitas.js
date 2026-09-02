'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalDDMMYYYY, getStatusBadge } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { Calendar, AlertTriangle, CheckCircle2, Clock, XCircle, Download, Printer, Filter, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Kolektabilitas() {
  const { user } = useAuth();
  const { donasi, donatur, users } = useData();
  const now = new Date();
  const [dateFilterMode, setDateFilterMode] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDateFilterMode, setTempDateFilterMode] = useState('semua');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  if (!hasPermission(user, 'laporan.kolektabilitas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  const openFilterModal = () => {
    setTempDateFilterMode(dateFilterMode);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowFilterModal(true);
  };

  const applyDateFilter = () => {
    setDateFilterMode(tempDateFilterMode);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowFilterModal(false);
  };

  const getSelectedPeriodLabel = () => {
    if (dateFilterMode === 'semua') return 'Semua Waktu';
    if (dateFilterMode === 'hari_ini') return 'Hari Ini';
    if (dateFilterMode === 'kemarin') return 'Kemarin';
    if (dateFilterMode === '7_hari') return '7 Hari Terakhir';
    if (dateFilterMode === '30_hari') return '30 Hari Terakhir';
    if (dateFilterMode === 'custom') {
      if (startDate && endDate) return `${formatTanggalDDMMYYYY(startDate)} s.d ${formatTanggalDDMMYYYY(endDate)}`;
      if (startDate) return `Mulai ${formatTanggalDDMMYYYY(startDate)}`;
      if (endDate) return `Sampai ${formatTanggalDDMMYYYY(endDate)}`;
      return 'Tanggal Custom';
    }
    return 'Semua Waktu';
  };

  const { filterStart, filterEnd } = useMemo(() => {
    if (dateFilterMode === 'semua') return { filterStart: null, filterEnd: null };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateFilterMode === 'hari_ini') {
      return { filterStart: today, filterEnd: tomorrow };
    } else if (dateFilterMode === 'kemarin') {
      const kemarin = new Date(today);
      kemarin.setDate(kemarin.getDate() - 1);
      return { filterStart: kemarin, filterEnd: today };
    } else if (dateFilterMode === '7_hari') {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { filterStart: start, filterEnd: tomorrow };
    } else if (dateFilterMode === '30_hari') {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { filterStart: start, filterEnd: tomorrow };
    } else if (dateFilterMode === 'custom') {
      let start = startDate ? new Date(startDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      let end = endDate ? new Date(endDate) : null;
      if (end) {
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1);
      }
      return { filterStart: start, filterEnd: end };
    }
    return { filterStart: null, filterEnd: null };
  }, [dateFilterMode, startDate, endDate]);

  const checkDateInRange = (dateString, start, end) => {
    if (!start && !end) return true;
    const d = new Date(dateString);
    if (start && d < start) return false;
    if (end && d >= end) return false;
    return true;
  };

  const kolektabilitas = useMemo(() => {
    // Get relevant donatur list
    let donaturList = donatur;
    if (isPetugas) {
      donaturList = donatur.filter(d => d.createdBy === user?.id);
    }

    return donaturList.map(d => {
      // Find donations from this donatur in the selected period (or all if 'semua')
      const donasiDonatur = donasi.filter(dn => dn.donaturId === d.id && checkDateInRange(dn.tanggal, filterStart, filterEnd));

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
  }, [donatur, donasi, users, isPetugas, user, filterStart, filterEnd]);

  const sudahCount = kolektabilitas.filter(d => d.sudahDonasi).length;
  const belumCount = kolektabilitas.filter(d => !d.sudahDonasi).length;
  const totalAmount = kolektabilitas.reduce((sum, d) => sum + d.totalDonasi, 0);
  const persen = kolektabilitas.length > 0 ? Math.round((sudahCount / kolektabilitas.length) * 100) : 0;

  const getPeriodeString = () => getSelectedPeriodLabel().toUpperCase();

  const getExportFileName = () => {
    const periodeStr = getSelectedPeriodLabel();
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
          
          doc.text(`PERIODE: ${periodeStr}`, 14, 15);
          
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
          <Filter size={16} color="var(--text-secondary)" />
          <span className="font-semibold text-secondary">Filter Data</span>
        </div>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-sm text-secondary">Periode Waktu</label>
            <div 
              className="form-input flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors" 
              onClick={openFilterModal}
              style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px 14px' }}
            >
              <div className="flex items-center gap-sm">
                <Calendar size={16} color="var(--text-tertiary)" />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{getSelectedPeriodLabel()}</span>
              </div>
              <ChevronRight size={16} color="var(--text-tertiary)" />
            </div>
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
      
      {/* Modal Filter Periode */}
      {showFilterModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px', backdropFilter: 'blur(4px)'
        }}>
          <div className="card animate-fade-in-up" style={{ width: '100%', maxWidth: '420px', backgroundColor: 'var(--bg-primary)', padding: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="flex justify-between items-center mb-lg">
              <h3 className="font-bold text-lg" style={{ color: 'var(--text)' }}>Pilih Periode</h3>
              <button 
                onClick={() => setShowFilterModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                title="Tutup"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-lg">
              <label className="form-label text-sm mb-sm block" style={{ color: 'var(--text-secondary)' }}>PILIHAN CEPAT</label>
              <div className="grid gap-sm" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {['semua', 'hari_ini', 'kemarin', '7_hari', '30_hari', 'custom'].map(mode => {
                  const labels = {
                    'semua': 'Semua Waktu',
                    'hari_ini': 'Hari Ini',
                    'kemarin': 'Kemarin',
                    '7_hari': '7 Hari Terakhir',
                    '30_hari': '30 Hari Terakhir',
                    'custom': 'Custom Range'
                  };
                  return (
                    <button 
                      key={mode}
                      className={`btn ${tempDateFilterMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        padding: '10px 8px', 
                        fontSize: '13.5px', 
                        justifyContent: 'center',
                        fontWeight: tempDateFilterMode === mode ? '600' : '400',
                        opacity: tempDateFilterMode === mode ? 1 : 0.85
                      }}
                      onClick={() => setTempDateFilterMode(mode)}
                    >
                      {labels[mode]}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {tempDateFilterMode === 'custom' && (
              <div className="p-md mb-lg animate-fade-in-up" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <div className="form-group mb-sm">
                  <label className="form-label text-sm" style={{ color: 'var(--text-secondary)' }}>Dari Tanggal</label>
                  <input type="date" className="form-input" value={tempStartDate} onChange={e => setTempStartDate(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label text-sm" style={{ color: 'var(--text-secondary)' }}>Sampai Tanggal</label>
                  <input type="date" className="form-input" value={tempEndDate} onChange={e => setTempEndDate(e.target.value)} />
                </div>
              </div>
            )}
            
            <div className="flex gap-sm pt-sm" style={{ borderTop: '1px solid var(--border-color)', marginTop: '24px', paddingTop: '16px' }}>
              <button className="btn btn-secondary flex-1" onClick={() => setShowFilterModal(false)} style={{ justifyContent: 'center', padding: '12px' }}>Batal</button>
              <button className="btn btn-primary flex-1" onClick={applyDateFilter} style={{ justifyContent: 'center', padding: '12px' }}>Terapkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
