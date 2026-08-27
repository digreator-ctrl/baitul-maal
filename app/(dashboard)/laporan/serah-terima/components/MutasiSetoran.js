'use client';

import { useMemo, useState, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalDDMMYYYY, getStatusBadge } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { AlertTriangle, Clock, Download, Printer, Filter, Calendar, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function MutasiSetoran() {
  const { user } = useAuth();
  const { donasi, setoran, users } = useData();
  const [filterPetugas, setFilterPetugas] = useState('semua');
  const [dateFilterMode, setDateFilterMode] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDateFilterMode, setTempDateFilterMode] = useState('semua');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

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

  const toggleRow = (id) => {
    if (expandedRow === id) {
      setExpandedRow(null);
    } else {
      setExpandedRow(id);
    }
  };

  if (!hasPermission(user, 'laporan.mutasi_setoran')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  // Get list of petugas users
  const petugasList = useMemo(() => {
    return users.filter(u => u.roles?.includes('petugas'));
  }, [users]);

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

  const summary = useMemo(() => {
    let targetPetugas = petugasList;
    if (isPetugas) {
      targetPetugas = petugasList.filter(p => p.id === user?.id);
    } else if (filterPetugas !== 'semua') {
      targetPetugas = petugasList.filter(p => p.id === filterPetugas);
    }

    return targetPetugas.map(petugas => {
      // Total tagihan (all donasi collected by this petugas)
      const donasiPetugas = donasi
        .filter(d => d.petugasId === petugas.id)
        .filter(d => checkDateInRange(d.tanggal, filterStart, filterEnd));
      const totalTagihan = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);

      // Setoran by this petugas
      const setoranPetugas = setoran
        .filter(s => s.petugasId === petugas.id)
        .filter(s => checkDateInRange(s.tanggal, filterStart, filterEnd));
      
      const totalDisetor = setoranPetugas
        .filter(s => s.status === 'terverifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const totalPending = setoranPetugas
        .filter(s => s.status === 'menunggu_verifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const totalDitolak = setoranPetugas
        .filter(s => s.status === 'ditolak')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const sisaMengendap = totalTagihan - totalDisetor - totalPending;

      return {
        petugas,
        totalTagihan,
        totalDisetor,
        totalPending,
        totalDitolak,
        sisaMengendap: Math.max(0, sisaMengendap),
        setoranDetail: setoranPetugas.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)),
        jumlahDonasi: donasiPetugas.length,
      };
    });
  }, [petugasList, donasi, setoran, isPetugas, user, filterPetugas, filterStart, filterEnd]);

  const grandTotal = {
    tagihan: summary.reduce((s, r) => s + r.totalTagihan, 0),
    disetor: summary.reduce((s, r) => s + r.totalDisetor, 0),
    pending: summary.reduce((s, r) => s + r.totalPending, 0),
    mengendap: summary.reduce((s, r) => s + r.sisaMengendap, 0),
  };

  const allSetoran = useMemo(() => {
    let targetPetugas = petugasList;
    if (isPetugas) {
      targetPetugas = petugasList.filter(p => p.id === user?.id);
    } else if (filterPetugas !== 'semua') {
      targetPetugas = petugasList.filter(p => p.id === filterPetugas);
    }
    const petugasIds = targetPetugas.map(p => p.id);
    
    return setoran
      .filter(s => petugasIds.includes(s.petugasId))
      .filter(s => checkDateInRange(s.tanggal, filterStart, filterEnd))
      .map(s => {
        const p = targetPetugas.find(pt => pt.id === s.petugasId);
        const b = users.find(u => u.id === s.verifikasiOleh);
        return { 
          ...s, 
          petugasName: p?.name || 'Unknown',
          bendaharaName: b?.name || '-'
        };
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [setoran, petugasList, isPetugas, user, filterPetugas, filterStart, filterEnd, users]);

  const getExportFileName = () => {
    let petugasStr = 'Semua Petugas';
    if (filterPetugas !== 'semua') {
      petugasStr = petugasList.find(p => p.id === filterPetugas)?.name || 'Semua Petugas';
    }
    const periodeStr = getSelectedPeriodLabel();
    return `Mutasi Setoran - ${periodeStr} - ${petugasStr}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Tanggal', 'Nama Petugas', 'Nominal Setoran', 'Bendahara', 'Status'];
    const csvData = allSetoran.map((row, i) => {
      const status = getStatusBadge(row.status).label;
      return [
        i + 1,
        formatTanggalDDMMYYYY(row.tanggal),
        `"${row.petugasName}"`,
        row.totalNominal,
        `"${row.bendaharaName}"`,
        `"${status}"`
      ].join(',');
    });
    
    // Add total rows
    csvData.push(`"","Ringkasan Akumulasi:"`);
    csvData.push(`"","Total Tagihan:",${grandTotal.tagihan},"","",""`);
    csvData.push(`"","Total Terverifikasi:",${grandTotal.disetor},"","",""`);
    csvData.push(`"","Total Pending:",${grandTotal.pending},"","",""`);
    csvData.push(`"","Sisa Mengendap:",${grandTotal.mengendap},"","",""`);
    
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
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    let petugasStr = 'Semua Petugas';
    if (filterPetugas !== 'semua') {
      petugasStr = petugasList.find(p => p.id === filterPetugas)?.name || 'Semua Petugas';
    }
    
    const headers = [[
      'NO', 
      'TANGGAL', 
      'NAMA PETUGAS', 
      'NOMINAL SETORAN', 
      { content: 'NAMA BENDAHARA', colSpan: 2, styles: { halign: 'center' } }, 
      'STATUS'
    ]];
    const data = allSetoran.map((row, i) => {
      const status = getStatusBadge(row.status).label;
      return [
        i + 1,
        formatTanggalDDMMYYYY(row.tanggal),
        row.petugasName,
        formatRupiah(row.totalNominal),
        { content: row.bendaharaName, colSpan: 2, styles: { halign: 'left' } },
        status
      ];
    });
    
    // Add total rows
    data.push([
      { content: 'Ringkasan Akumulasi', colSpan: 3, rowSpan: 4, styles: { halign: 'right', valign: 'top', fontStyle: 'bold' } }, 
      { content: 'Total Tagihan', styles: { halign: 'left', fontStyle: 'bold' } }, 
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.tagihan), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    data.push([
      { content: 'Terverifikasi', styles: { halign: 'left', fontStyle: 'bold' } }, 
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.disetor), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    data.push([
      { content: 'Pending', styles: { halign: 'left', fontStyle: 'bold' } }, 
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.pending), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    data.push([
      { content: 'Sisa Mengendap', styles: { halign: 'left', fontStyle: 'bold' } }, 
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.mengendap), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    
    const totalPagesExp = '{total_pages_count_string}';

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 55,
      margin: { top: 30, left: 14, right: 14, bottom: 20 },
      theme: 'grid',
      headStyles: { 
        fillColor: [255, 255, 255], 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0], 
        lineWidth: 0.1, 
        fontStyle: 'bold', 
        halign: 'center',
        fontSize: 8
      },
      bodyStyles: { 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0], 
        lineWidth: 0.1,
        fontSize: 8
      },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 6 },
        5: { minCellWidth: 35 },
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
          doc.text('LAPORAN MUTASI SETORAN', pageWidth / 2, 40, { align: 'center' });
          const periodeStr = getSelectedPeriodLabel().toUpperCase();
          doc.text(`PERIODE: ${periodeStr}`, pageWidth / 2, 45, { align: 'center' });
          doc.text(`PETUGAS: ${petugasStr.toUpperCase()}`, pageWidth / 2, 50, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(150, 150, 150);
          const periodeStr = getSelectedPeriodLabel().toUpperCase();
          doc.text(`PERIODE: ${periodeStr}`, 14, 15);
          doc.text(`PETUGAS: ${petugasStr.toUpperCase()}`, 14, 20);
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
        
        doc.text('LAPORAN MUTASI SETORAN', 14, pageHeight - 10);
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
      {/* Filters (Selalu Nampak) */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Filter size={16} color="var(--text-secondary)" />
          <span className="font-semibold text-secondary">Filter Data</span>
        </div>
        
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Periode Waktu</label>
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

          {!isPetugas && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Petugas</label>
              <select className="form-select" value={filterPetugas} onChange={(e) => setFilterPetugas(e.target.value)}>
                <option value="semua">Semua Petugas</option>
                {petugasList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grand Total Cards */}
      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="text-sm text-secondary mb-xs">Total Tagihan</div>
          <div className="text-xl font-bold text-primary-color">{formatRupiah(grandTotal.tagihan)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="text-sm text-secondary mb-xs">Total Terverifikasi</div>
          <div className="text-xl font-bold" style={{ color: 'var(--success)' }}>{formatRupiah(grandTotal.disetor)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="text-sm text-secondary mb-xs">Menunggu Verifikasi</div>
          <div className="text-xl font-bold" style={{ color: 'var(--info)' }}>{formatRupiah(grandTotal.pending)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="text-sm text-secondary mb-xs">Sisa Mengendap</div>
          <div className="text-xl font-bold" style={{ color: 'var(--warning)' }}>{formatRupiah(grandTotal.mengendap)}</div>
        </div>
      </div>

      {/* Table Detail Setoran */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Nama Petugas</th>
              <th className="text-right">Nominal Setoran</th>
              <th>Nama Bendahara</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {allSetoran.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-secondary" style={{ padding: '32px' }}>
                  <div className="empty-state" style={{ padding: 0 }}>
                    <Clock size={48} />
                    <p>Tidak ada data setoran yang tersedia.</p>
                  </div>
                </td>
              </tr>
            ) : (
              allSetoran.map((row, idx) => {
                const status = getStatusBadge(row.status);
                return (
                  <tr key={row.id}>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Tanggal">{formatTanggalDDMMYYYY(row.tanggal)}</td>
                    <td data-label="Nama Petugas">
                      <div className="font-semibold">{row.petugasName}</div>
                    </td>
                    <td data-label="Nominal Setoran" className="font-semibold text-right">{formatRupiah(row.totalNominal)}</td>
                    <td data-label="Bendahara">{row.bendaharaName}</td>
                    <td data-label="Status" className="text-center">
                      <span className={`badge badge-${status.variant}`}>{status.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {allSetoran.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={3} className="font-bold text-right" style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                  Ringkasan Akumulasi<br/>(Semua Petugas Sesuai Filter)
                </td>
                <td colSpan={3}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="font-bold">Total Tagihan:</span>
                      <span className="font-bold">{formatRupiah(grandTotal.tagihan)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                      <span className="font-bold">Terverifikasi:</span>
                      <span className="font-bold">{formatRupiah(grandTotal.disetor)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--info)' }}>
                      <span className="font-bold">Pending:</span>
                      <span className="font-bold">{formatRupiah(grandTotal.pending)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: grandTotal.mengendap > 0 ? 'var(--warning)' : 'inherit' }}>
                      <span className="font-bold">Sisa Mengendap:</span>
                      <span className="font-bold">{formatRupiah(grandTotal.mengendap)}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
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
