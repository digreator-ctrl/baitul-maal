'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, formatTanggalDDMMYYYY } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { Filter, Calendar, Search, Download, Printer, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function RealisasiPengeluaran() {
  const { user } = useAuth();
  const { pengeluaran, metodeDonasi, posPengeluaran, users } = useData();
  const [filterPos, setFilterPos] = useState('semua');
  const [filterSumber, setFilterSumber] = useState('semua');
  const [filterBendahara, setFilterBendahara] = useState('semua');
  
  const bendaharaList = useMemo(() => {
    return users.filter(u => u.role === 'admin' || u.role === 'bendahara');
  }, [users]);
  
  const [dateFilterMode, setDateFilterMode] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDateFilterMode, setTempDateFilterMode] = useState('semua');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  if (!hasPermission(user, 'laporan.realisasi_pengeluaran')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

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
    return pengeluaran
      .filter(p => {
        if (!checkDateInRange(p.tanggal, filterStart, filterEnd)) return false;
        if (filterPos !== 'semua' && p.posPengeluaranId !== filterPos) return false;
        if (filterSumber !== 'semua' && p.sumberDanaId !== filterSumber) return false;
        if (filterBendahara !== 'semua' && p.createdBy !== filterBendahara) return false;
        return true;
      })
      .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [pengeluaran, filterStart, filterEnd, filterPos, filterSumber, filterBendahara]);

  const totalFiltered = filtered.reduce((sum, p) => sum + p.nominal, 0);



  const getExportFileName = () => {
    const periodeStr = getSelectedPeriodLabel();
    
    let posStr = 'Semua Pos';
    if (filterPos !== 'semua') {
      posStr = posPengeluaran.find(p => p.id === filterPos)?.nama || 'Semua Pos';
    }
    
    return `Realisasi Penyaluran - ${periodeStr} - ${posStr}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Tanggal', 'Pos Pengeluaran', 'Sumber Dana', 'Keterangan', 'Nominal', 'Bendahara'];
    const csvData = filtered.map((row, i) => {
      const met = metodeDonasi.find(m => m.id === row.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === row.posPengeluaranId);
      const ben = users.find(u => u.id === row.createdBy);
      return [
        i + 1,
        formatTanggalDDMMYYYY(row.tanggal),
        `"${pos?.nama || '-'}"`,
        `"${met?.nama || '-'}"`,
        `"${row.keterangan || '-'}"`,
        row.nominal,
        `"${ben?.name || '-'}"`
      ].join(',');
    });
    
    // Add total row
    csvData.push(`"","","","","Total",${totalFiltered},""`);
    
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
    
    const periodeStr = getSelectedPeriodLabel().toUpperCase();
    
    let posStr = 'Semua Pos';
    if (filterPos !== 'semua') {
      posStr = posPengeluaran.find(p => p.id === filterPos)?.nama || 'Semua Pos';
    }
    const posPengeluaranStr = posStr.toUpperCase();
    
    const headers = [['NO', 'TANGGAL', 'POS\nPENGELUARAN', 'SUMBER\nDANA', 'KETERANGAN', 'NOMINAL', 'BENDAHARA']];
    const data = filtered.map((row, i) => {
      const met = metodeDonasi.find(m => m.id === row.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === row.posPengeluaranId);
      const ben = users.find(u => u.id === row.createdBy);
      return [
        i + 1,
        formatTanggalDDMMYYYY(row.tanggal),
        pos?.nama || '-',
        met?.nama || '-',
        row.keterangan || '-',
        formatRupiah(row.nominal),
        ben?.name || '-'
      ];
    });
    
    // Add total row
    data.push([
      { content: 'TOTAL', colSpan: 4, styles: { halign: 'center', fontStyle: 'bold' } }, 
      '',
      { content: formatRupiah(totalFiltered), styles: { fontStyle: 'bold', halign: 'right' } },
      ''
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
        valign: 'middle',
        fontSize: 8
      },
      bodyStyles: { 
        textColor: [0, 0, 0], 
        lineColor: [0, 0, 0], 
        lineWidth: 0.1,
        fontSize: 8
      },
      columnStyles: {
        5: { halign: 'right' }
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
          doc.text('LAPORAN REALISASI PENYALURAN', pageWidth / 2, 40, { align: 'center' });
          doc.text(`PERIODE: ${periodeStr}`, pageWidth / 2, 46, { align: 'center' });
          doc.text(`POS PENGELUARAN: ${posPengeluaranStr}`, pageWidth / 2, 52, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bolditalic');
          doc.setTextColor(150, 150, 150);
          doc.text(`PERIODE: ${periodeStr}`, 14, 15);
          doc.text(`POS PENGELUARAN: ${posPengeluaranStr}`, 14, 20);
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
        
        doc.text('LAPORAN REALISASI PENYALURAN', 14, pageHeight - 10);
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
      
      {/* Summary Card */}
      <div className="saldo-card mb-lg" style={{ background: 'linear-gradient(135deg, #b91c1c, #ef4444)' }}>
        <div className="saldo-label">Total Pengeluaran</div>
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
            <label className="form-label text-sm text-secondary">Pos Pengeluaran</label>
            <select className="form-select" value={filterPos} onChange={(e) => setFilterPos(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
              <option value="semua">Semua Pos</option>
              {posPengeluaran.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label text-sm text-secondary">Bendahara</label>
            <select className="form-select" value={filterBendahara} onChange={(e) => setFilterBendahara(e.target.value)} style={{ padding: '10px 14px', borderRadius: '8px' }}>
              <option value="semua">Semua Bendahara</option>
              {bendaharaList.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
              <th>Pos Pengeluaran</th>
              <th>Sumber Dana</th>
              <th>Keterangan</th>
              <th className="text-right">Nominal</th>
              <th>Bendahara</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary" style={{ padding: '32px' }}>
                  Tidak ada data untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              filtered.map((p, idx) => {
                const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
                const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
                const ben = users.find(u => u.id === p.createdBy);
                return (
                  <tr key={p.id}>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Tanggal">{formatTanggalDDMMYYYY(p.tanggal)}</td>
                    <td data-label="Pos"><span className="badge badge-danger">{pos?.nama || '-'}</span></td>
                    <td data-label="Sumber">{met?.nama || '-'}</td>
                    <td data-label="Keterangan" className="text-sm">{p.keterangan || '-'}</td>
                    <td data-label="Nominal" className="text-right font-semibold" style={{ color: 'var(--danger)' }}>{formatRupiah(p.nominal)}</td>
                    <td data-label="Bendahara">{ben?.name || '-'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={5} className="font-bold text-right">Total</td>
                <td className="text-right font-bold" style={{ color: 'var(--danger)' }}>{formatRupiah(totalFiltered)}</td>
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
