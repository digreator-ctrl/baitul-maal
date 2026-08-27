'use client';

import { useMemo, useState, Fragment } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { AlertTriangle, Clock, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function MutasiSetoran() {
  const { user } = useAuth();
  const { donasi, setoran, users } = useData();
  const [filterPetugas, setFilterPetugas] = useState('semua');
  const [expandedRow, setExpandedRow] = useState(null);

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

  const summary = useMemo(() => {
    let targetPetugas = petugasList;
    if (isPetugas) {
      targetPetugas = petugasList.filter(p => p.id === user?.id);
    } else if (filterPetugas !== 'semua') {
      targetPetugas = petugasList.filter(p => p.id === filterPetugas);
    }

    return targetPetugas.map(petugas => {
      // Total tagihan (all donasi collected by this petugas)
      const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id);
      const totalTagihan = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);

      // Setoran by this petugas
      const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
      
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
  }, [petugasList, donasi, setoran, isPetugas, user, filterPetugas]);

  const grandTotal = {
    tagihan: summary.reduce((s, r) => s + r.totalTagihan, 0),
    disetor: summary.reduce((s, r) => s + r.totalDisetor, 0),
    pending: summary.reduce((s, r) => s + r.totalPending, 0),
    mengendap: summary.reduce((s, r) => s + r.sisaMengendap, 0),
  };

  const getExportFileName = () => {
    let petugasStr = 'Semua Petugas';
    if (filterPetugas !== 'semua') {
      petugasStr = petugasList.find(p => p.id === filterPetugas)?.name || 'Semua Petugas';
    }
    return `Laporan Mutasi Setoran - ${petugasStr}`;
  };

  const handleExport = () => {
    const headers = ['No', 'Nama Petugas', 'Total Tagihan', 'Disetor (Terverifikasi)', 'Menunggu Verifikasi', 'Ditolak', 'Sisa Mengendap'];
    const csvData = summary.map((row, i) => {
      return [
        i + 1,
        `"${row.petugas.name}"`,
        row.totalTagihan,
        row.totalDisetor,
        row.totalPending,
        row.totalDitolak,
        row.sisaMengendap
      ].join(',');
    });
    
    // Add total row
    const totalDitolakAll = summary.reduce((s, r) => s + r.totalDitolak, 0);
    csvData.push(`"","Total",${grandTotal.tagihan},${grandTotal.disetor},${grandTotal.pending},${totalDitolakAll},${grandTotal.mengendap}`);
    
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
    
    const headers = [['NO', 'NAMA PETUGAS', 'TOTAL TAGIHAN', 'DISETOR', 'PENDING', 'DITOLAK', 'MENGENDAP']];
    const data = summary.map((row, i) => {
      return [
        i + 1,
        row.petugas.name,
        formatRupiah(row.totalTagihan),
        formatRupiah(row.totalDisetor),
        formatRupiah(row.totalPending),
        formatRupiah(row.totalDitolak),
        formatRupiah(row.sisaMengendap)
      ];
    });
    
    // Add total row
    const totalDitolakAll = summary.reduce((s, r) => s + r.totalDitolak, 0);
    data.push([
      { content: 'TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.tagihan), styles: { fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.disetor), styles: { fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.pending), styles: { fontStyle: 'bold' } }, 
      { content: formatRupiah(totalDitolakAll), styles: { fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal.mengendap), styles: { fontStyle: 'bold' } }
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
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
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
          doc.text(`PETUGAS: ${petugasStr.toUpperCase()}`, pageWidth / 2, 46, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(150, 150, 150);
          doc.text(`PETUGAS: ${petugasStr.toUpperCase()}`, 14, 15);
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
      {/* Filter (non-petugas only) */}
      {!isPetugas && (
        <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Filter Petugas</label>
            <select className="form-select" value={filterPetugas} onChange={(e) => setFilterPetugas(e.target.value)}>
              <option value="semua">Semua Petugas</option>
              {petugasList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

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

      {/* Table Per Petugas */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Petugas</th>
              <th className="text-right">Total Tagihan</th>
              <th className="text-right">Disetor (Terverifikasi)</th>
              <th className="text-right">Menunggu Verifikasi</th>
              <th className="text-right">Sisa Mengendap</th>
              <th className="text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {summary.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary" style={{ padding: '32px' }}>
                  <div className="empty-state" style={{ padding: 0 }}>
                    <Clock size={48} />
                    <p>Tidak ada data petugas yang tersedia.</p>
                  </div>
                </td>
              </tr>
            ) : (
              summary.map((row, idx) => (
                <Fragment key={row.petugas.id}>
                  <tr>
                    <td data-label="No">{idx + 1}</td>
                    <td data-label="Nama Petugas">
                      <div className="flex items-center gap-sm">
                        <div className="list-item-avatar" style={{ background: 'var(--primary-bg)', color: 'var(--primary)', width: '32px', height: '32px', fontSize: '12px' }}>
                          {row.petugas.avatar}
                        </div>
                        <div>
                          <div className="font-semibold">{row.petugas.name}</div>
                          <div className="text-xs text-secondary">{row.jumlahDonasi} donasi</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Total Tagihan" className="font-semibold text-right">{formatRupiah(row.totalTagihan)}</td>
                    <td data-label="Disetor" className="font-semibold text-right" style={{ color: 'var(--success)' }}>{formatRupiah(row.totalDisetor)}</td>
                    <td data-label="Pending" className="font-semibold text-right" style={{ color: 'var(--info)' }}>{formatRupiah(row.totalPending)}</td>
                    <td data-label="Mengendap" className="font-semibold text-right" style={{ color: row.sisaMengendap > 0 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                      <div className="flex items-center justify-end gap-xs">
                        {row.sisaMengendap > 0 && <AlertTriangle size={14} color="var(--warning)" />}
                        {formatRupiah(row.sisaMengendap)}
                      </div>
                    </td>
                    <td data-label="Aksi" className="text-center">
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => toggleRow(row.petugas.id)}
                        disabled={row.setoranDetail.length === 0}
                      >
                        {expandedRow === row.petugas.id ? 'Tutup' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {/* Expanded Row */}
                  {expandedRow === row.petugas.id && row.setoranDetail.length > 0 && (
                    <tr style={{ background: 'var(--bg-secondary)' }}>
                      <td colSpan={7} style={{ padding: '16px' }}>
                        <div className="text-sm font-semibold text-secondary mb-sm">Detail Setoran - {row.petugas.name}</div>
                        <div className="grid gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                          {row.setoranDetail.map(s => {
                            const status = getStatusBadge(s.status);
                            return (
                              <div key={s.id} className="card p-sm flex justify-between items-center" style={{ background: 'var(--bg-primary)' }}>
                                <div>
                                  <div className="font-semibold text-sm">{s.keterangan || 'Setoran'}</div>
                                  <div className="text-xs text-secondary">{formatTanggalShort(s.tanggal)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-sm">{formatRupiah(s.totalNominal)}</div>
                                  <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.7rem' }}>{status.label}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
          {summary.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={2} className="font-bold text-right">Total</td>
                <td className="font-bold text-right">{formatRupiah(grandTotal.tagihan)}</td>
                <td className="font-bold text-right" style={{ color: 'var(--success)' }}>{formatRupiah(grandTotal.disetor)}</td>
                <td className="font-bold text-right" style={{ color: 'var(--info)' }}>{formatRupiah(grandTotal.pending)}</td>
                <td className="font-bold text-right" style={{ color: grandTotal.mengendap > 0 ? 'var(--warning)' : 'inherit' }}>{formatRupiah(grandTotal.mengendap)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
