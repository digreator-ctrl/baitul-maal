'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, formatTanggalDDMMYYYY } from '@/lib/utils';
import { hasPermission } from '@/lib/rbac';
import { ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Download, Printer, Filter, Calendar, X, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function BukuKas() {
  const { user } = useAuth();
  const { donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, getSaldoPerMetode, users } = useData();
  const [filterSumber, setFilterSumber] = useState('semua');
  
  const [dateFilterMode, setDateFilterMode] = useState('semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempDateFilterMode, setTempDateFilterMode] = useState('semua');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

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

  if (!hasPermission(user, 'laporan.buku_kas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

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

  const { mutations, saldoAwal } = useMemo(() => {
    const items = [];
    let calcSaldoAwal = 0;

    const isBeforeStart = (dateString) => {
      if (!filterStart) return false;
      return new Date(dateString) < filterStart;
    };

    // Verified donations as income
    donasi.filter(d => d.status === 'terverifikasi').forEach(d => {
      const before = isBeforeStart(d.tanggal);
      const inRange = checkDateInRange(d.tanggal, filterStart, filterEnd);
      
      if (filterSumber !== 'semua' && d.metodeDonasiId !== filterSumber) return;

      if (before) {
        calcSaldoAwal += d.nominal;
      } else if (inRange) {
        const don = donatur.find(x => x.id === d.donaturId);
        const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
        const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
        const pj = users?.find(u => u.id === d.petugasId);
        items.push({
          id: d.id, tanggal: d.tanggal, type: 'masuk', nominal: d.nominal,
          metode: met?.nama || '-', metodeId: d.metodeDonasiId,
          keterangan: `${kat?.nama || '-'} - ${don?.nama || '-'} - ${met?.nama || '-'}`,
          pjName: pj?.name || '-',
        });
      }
    });

    // Expenses as outflow
    pengeluaran.forEach(p => {
      const before = isBeforeStart(p.tanggal);
      const inRange = checkDateInRange(p.tanggal, filterStart, filterEnd);
      
      if (filterSumber !== 'semua' && p.sumberDanaId !== filterSumber) return;

      if (before) {
        calcSaldoAwal -= p.nominal;
      } else if (inRange) {
        const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
        const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
        const pj = users?.find(u => u.id === (p.dibuatOleh || p.bendaharaId));
        items.push({
          id: p.id, tanggal: p.tanggal, type: 'keluar', nominal: p.nominal,
          metode: met?.nama || '-', metodeId: p.sumberDanaId,
          keterangan: `${pos?.nama || '-'} - ${p.keterangan || '-'} - ${met?.nama || '-'}`,
          pjName: pj?.name || '-',
        });
      }
    });

    return { 
      mutations: items.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)),
      saldoAwal: calcSaldoAwal
    };
  }, [donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, filterSumber, filterStart, filterEnd, users]);

  // Build running balance
  const mutationsWithBalance = useMemo(() => {
    let runningTotal = saldoAwal;
    const withBalance = mutations.map(m => {
      runningTotal += m.type === 'masuk' ? m.nominal : -m.nominal;
      return { ...m, balance: Math.max(0, runningTotal) };
    });
    
    if (filterStart) {
      withBalance.unshift({
        id: 'saldo-awal',
        type: 'saldo_awal',
        tanggal: filterStart.toISOString(),
        keterangan: 'Saldo Awal Periode',
        nominal: 0,
        balance: Math.max(0, saldoAwal),
        pjName: '-'
      });
    }

    return withBalance;
  }, [mutations, saldoAwal, filterStart]);

  const totalMasuk = mutations.filter(m => m.type === 'masuk').reduce((s, m) => s + m.nominal, 0);
  const totalKeluar = mutations.filter(m => m.type === 'keluar').reduce((s, m) => s + m.nominal, 0);

  const getExportFileName = () => {
    return `Buku Kas Periode ${getSelectedPeriodLabel()}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Tanggal', 'Keterangan', 'Metode', 'Jenis Mutasi', 'Nominal', 'Saldo'];
    const csvData = mutationsWithBalance.map((m, i) => {
      return [
        i + 1,
        `"${formatTanggalDDMMYYYY(m.tanggal)}"`,
        `"${m.keterangan}"`,
        `"${m.metode}"`,
        m.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        m.nominal,
        m.balance
      ].join(',');
    });
    
    // Add total row
    csvData.push(`"","","","","Total Pemasukan",${totalMasuk},""`);
    csvData.push(`"","","","","Total Pengeluaran",${totalKeluar},""`);
    csvData.push(`"","","","","Saldo Akhir","",${Math.max(0, totalMasuk - totalKeluar)}`);
    
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
    
    let sumberStr = 'Semua Sumber Dana';
    if (filterSumber !== 'semua') {
      sumberStr = metodeDonasi.find(m => m.id === filterSumber)?.nama || 'Semua Sumber Dana';
    }
    
    const headers = [['NO', 'TANGGAL', 'TRANSAKSI', 'KETERANGAN', { content: 'NOMINAL', colSpan: 2, styles: { halign: 'center' } }, 'SALDO', 'PJ']];
    const data = mutationsWithBalance.map((m, i) => {
      let transaksiStr = 'Mutasi';
      if (m.type === 'saldo_awal') transaksiStr = 'Saldo Awal';
      else if (m.type === 'masuk') transaksiStr = 'Pemasukan';
      else if (m.type === 'keluar') transaksiStr = 'Pengeluaran';

      return [
        i + 1,
        formatTanggalDDMMYYYY(m.tanggal),
        transaksiStr,
        m.keterangan,
        { content: m.type === 'saldo_awal' ? '-' : formatRupiah(m.nominal), colSpan: 2, styles: { halign: 'right' } },
        formatRupiah(m.balance),
        m.pjName || '-'
      ];
    });
    
    // Add total rows
    data.push([
      { content: 'RINGKASAN MUTASI', colSpan: 4, rowSpan: 3, styles: { halign: 'right', valign: 'middle', fontStyle: 'bold' } }, 
      { content: 'TOTAL PEMASUKAN', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: formatRupiah(totalMasuk), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    data.push([
      { content: 'TOTAL PENGELUARAN', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: formatRupiah(totalKeluar), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
    ]);
    data.push([
      { content: 'SALDO AKHIR', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: ':', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: formatRupiah(Math.max(0, saldoAwal + totalMasuk - totalKeluar)), colSpan: 2, styles: { fontStyle: 'bold', halign: 'left' } }
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
        0: { halign: 'center', cellWidth: 8 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'center', cellWidth: 5 }, // Kolom untuk ':'
        6: { halign: 'right', cellWidth: 25 },
        7: { halign: 'center', cellWidth: 22 }
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
          doc.text('LAPORAN BUKU KAS', pageWidth / 2, 40, { align: 'center' });
          doc.text(`PERIODE: ${getSelectedPeriodLabel().toUpperCase()}`, pageWidth / 2, 46, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bolditalic');
          doc.setTextColor(150, 150, 150);
          doc.text(`PERIODE: ${getSelectedPeriodLabel().toUpperCase()}`, 14, 15);
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
        
        doc.text('LAPORAN BUKU KAS', 14, pageHeight - 10);
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
        
        <div className="form-group" style={{ marginBottom: 0, maxWidth: '280px' }}>
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
      </div>

      {/* Mutation Timeline */}
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        {mutationsWithBalance.length === 0 ? (
          <div className="empty-state py-xl">
            <BookOpen size={48} />
            <h3>Belum Ada Mutasi</h3>
            <p>Belum ada transaksi yang tercatat.</p>
          </div>
        ) : (
          <div className="table-container table-mobile">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>No</th>
                  <th>Tanggal</th>
                  <th>Transaksi</th>
                  <th>Keterangan</th>
                  <th className="text-right">Nominal</th>
                  <th className="text-right">Saldo</th>
                  <th>PJ</th>
                </tr>
              </thead>
              <tbody>
                {mutationsWithBalance.map((m, index) => (
                  <tr key={m.id}>
                    <td data-label="No" style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td data-label="Tanggal">{formatTanggalDDMMYYYY(m.tanggal)}</td>
                    <td data-label="Transaksi">
                      {m.type === 'saldo_awal' && (
                        <span className="badge badge-neutral flex items-center gap-xs" style={{ display: 'inline-flex', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', padding: '4px 8px', borderRadius: '4px' }}>
                          <BookOpen size={12} /> Saldo Awal
                        </span>
                      )}
                      {m.type === 'masuk' && (
                        <span className="badge badge-success flex items-center gap-xs" style={{ display: 'inline-flex' }}>
                          <ArrowUpRight size={12} /> Uang Masuk
                        </span>
                      )}
                      {m.type === 'keluar' && (
                        <span className="badge badge-danger flex items-center gap-xs" style={{ display: 'inline-flex' }}>
                          <ArrowDownRight size={12} /> Uang Keluar
                        </span>
                      )}
                    </td>
                    <td data-label="Keterangan">
                      <div className="font-semibold" style={{ color: m.type === 'saldo_awal' ? 'var(--text-secondary)' : 'inherit' }}>{m.keterangan}</div>
                    </td>
                    <td data-label="Nominal" className="text-right font-bold" style={{ color: m.type === 'masuk' ? 'var(--success)' : m.type === 'keluar' ? 'var(--danger)' : 'inherit' }}>
                      {m.type === 'masuk' ? '+' : m.type === 'keluar' ? '-' : ''}{m.type !== 'saldo_awal' ? formatRupiah(m.nominal) : '-'}
                    </td>
                    <td data-label="Saldo" className="text-right font-bold text-primary-color">
                      {formatRupiah(m.balance)}
                    </td>
                    <td data-label="PJ">
                      {m.pjName}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="font-bold text-right" style={{ verticalAlign: 'top', paddingTop: '12px' }}>
                    Ringkasan Mutasi<br/>(Sesuai Filter Periode)
                  </td>
                  <td colSpan={3}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                        <span className="font-bold">Total Pemasukan:</span>
                        <span className="font-bold">+{formatRupiah(totalMasuk)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                        <span className="font-bold">Total Pengeluaran:</span>
                        <span className="font-bold">-{formatRupiah(totalKeluar)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px' }}>
                        <span className="font-bold">Saldo Akhir:</span>
                        <span className="font-bold">{formatRupiah(Math.max(0, saldoAwal + totalMasuk - totalKeluar))}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
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
