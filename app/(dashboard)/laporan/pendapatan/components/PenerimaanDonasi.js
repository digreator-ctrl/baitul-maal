'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalDDMMYYYY } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { Filter, HandCoins, Calendar, Search, Download, Printer, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PenerimaanDonasi() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, users } = useData();
  const [dateFilterMode, setDateFilterMode] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDateFilterMode, setTempDateFilterMode] = useState('semua');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [filterSumber, setFilterSumber] = useState('semua');
  const [filterPetugas, setFilterPetugas] = useState('semua');
  const [search, setSearch] = useState('');

  const petugasList = useMemo(() => {
    return users.filter(u => u.role === 'petugas');
  }, [users]);

  if (!hasPermission(user, 'laporan.penerimaan_donasi')) {
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

  const filtered = useMemo(() => {
    return donasi
      .filter(d => d.status === 'terverifikasi')
      .filter(d => {
        // Petugas only sees own data
        if (isPetugas && d.petugasId !== user?.id) return false;
        if (!isPetugas && filterPetugas !== 'semua' && d.petugasId !== filterPetugas) return false;
        // Period filter
        if (!checkDateInRange(d.tanggal, filterStart, filterEnd)) return false;
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
  }, [donasi, donatur, isPetugas, user, filterStart, filterEnd, filterSumber, search]);

  const totalFiltered = filtered.reduce((sum, d) => sum + d.nominal, 0);

  const getPeriodeString = () => getSelectedPeriodLabel().toUpperCase();

  const getSumberDanaString = () => {
    if (filterSumber === 'semua') return 'SEMUA SUMBER DANA';
    const sumber = metodeDonasi.find(m => m.id === filterSumber)?.nama;
    return sumber ? sumber.toUpperCase() : '-';
  };

  const getExportFileName = () => {
    const periodeStr = getSelectedPeriodLabel();
    
    let sumberStr = 'Semua Sumber Dana';
    if (filterSumber !== 'semua') {
      sumberStr = metodeDonasi.find(m => m.id === filterSumber)?.nama || 'Semua Sumber Dana';
    }
    
    return `Penerimaan Donasi Periode ${periodeStr} Sumber Dana ${sumberStr}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Tanggal', 'Sumber Dana', 'Nama Donatur', 'Nominal', 'Petugas'];
    const csvData = filtered.map((d, i) => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const pet = users.find(u => u.id === d.petugasId);
      
      return [
        i + 1,
        `"${formatTanggalDDMMYYYY(d.tanggal)}"`,
        `"${met?.nama || '-'}"`,
        `"${don?.nama || '-'}"`,
        d.nominal,
        `"${pet?.name || '-'}"`
      ].join(',');
    });
    
    // Add total row
    csvData.push(`"","","","Total",${totalFiltered},""`);
    
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
    
    const periodeStr = getPeriodeString();
    const sumberDanaStr = getSumberDanaString();
    
    const headers = [['NO', 'TANGGAL', 'SUMBER DANA', 'NAMA DONATUR', 'NOMINAL', 'PETUGAS']];
    const data = filtered.map((d, i) => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const pet = users.find(u => u.id === d.petugasId);
      
      return [
        i + 1,
        formatTanggalDDMMYYYY(d.tanggal),
        met?.nama || '-',
        don?.nama || '-',
        formatRupiah(d.nominal),
        pet?.name || '-'
      ];
    });
    
    // Add total row
    data.push([
      { content: 'TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, 
      { content: formatRupiah(totalFiltered), styles: { fontStyle: 'bold', halign: 'right' } }, 
      ''
    ]);
    
    const totalPagesExp = '{total_pages_count_string}';

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 65,
      margin: { top: 30, left: 14, right: 14, bottom: 20 },
      theme: 'grid',
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
        4: { halign: 'right' }
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
          doc.text('LAPORAN PENERIMAAN DONASI', pageWidth / 2, 40, { align: 'center' });
          doc.text(`PERIODE: ${periodeStr}`, pageWidth / 2, 46, { align: 'center' });
          doc.text(`SUMBER DANA: ${sumberDanaStr}`, pageWidth / 2, 52, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(150, 150, 150);
          doc.text(`PERIODE: ${periodeStr}`, 14, 15);
          doc.text(`SUMBER DANA: ${sumberDanaStr}`, 14, 20);
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
        
        doc.text('LAPORAN PENERIMAAN DONASI', 14, pageHeight - 10);
        // Calculate width using a dummy string of expected length so it aligns correctly after putTotalPages replacement
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
        <div className="grid gap-md mb-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-sm text-secondary">Sumber Dana</label>
            <select className="form-select" value={filterSumber} onChange={(e) => setFilterSumber(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
              <option value="semua">Semua Sumber Dana</option>
              {metodeDonasi.filter(m => m.aktif).map(m => (
                <option key={m.id} value={m.id}>{m.nama}</option>
              ))}
            </select>
          </div>
          {!isPetugas && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-sm text-secondary">Petugas</label>
              <select className="form-select" value={filterPetugas} onChange={(e) => setFilterPetugas(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
                <option value="semua">Semua Petugas</option>
                {petugasList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
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
              <th>Sumber Dana</th>
              <th>Nama Donatur</th>
              <th className="text-right">Nominal</th>
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
                    <td data-label="Tanggal">{formatTanggalDDMMYYYY(d.tanggal)}</td>
                    <td data-label="Sumber Dana">
                      <span className="badge badge-primary">{met?.nama || '-'}</span>
                    </td>
                    <td data-label="Donatur" className="font-semibold">{don?.nama || '-'}</td>
                    <td data-label="Nominal" className="font-semibold text-primary-color text-right">{formatRupiah(d.nominal)}</td>
                    <td data-label="Petugas">{pet?.name || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={4} className="font-bold text-right">Total</td>
                <td className="font-bold text-primary-color text-right">{formatRupiah(totalFiltered)}</td>
                <td></td>
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
