'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalDDMMYYYY } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { Wallet, Users, Landmark, AlertTriangle, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function PosisiSaldo() {
  const { user } = useAuth();
  const { donasi, setoran, pengeluaran, metodeDonasi, users, getSaldoPerMetode } = useData();

  if (!hasPermission(user, 'laporan.posisi_saldo')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const saldoPerMetode = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

  // Get petugas users
  const petugasList = useMemo(() => {
    return users.filter(u => u.roles?.includes('petugas'));
  }, [users]);

  // Compute saldo per petugas (dana yang masih mengendap)
  const saldoPerPetugas = useMemo(() => {
    return petugasList.map(petugas => {
      const donasiPetugas = donasi.filter(d => d.petugasId === petugas.id);
      const totalTagihan = donasiPetugas.reduce((sum, d) => sum + d.nominal, 0);

      const setoranPetugas = setoran.filter(s => s.petugasId === petugas.id);
      const totalDisetor = setoranPetugas
        .filter(s => s.status === 'terverifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);
      const totalPending = setoranPetugas
        .filter(s => s.status === 'menunggu_verifikasi')
        .reduce((sum, s) => sum + s.totalNominal, 0);

      const mengendap = Math.max(0, totalTagihan - totalDisetor - totalPending);

      return {
        ...petugas,
        mengendap,
        totalPending,
      };
    });
  }, [petugasList, donasi, setoran]);

  // Compute bendahara saldo (total verified - total pengeluaran)
  const saldoBendahara = useMemo(() => {
    const totalVerified = donasi
      .filter(d => d.status === 'terverifikasi')
      .reduce((sum, d) => sum + d.nominal, 0);
    const totalPengeluaran = pengeluaran.reduce((sum, p) => sum + p.nominal, 0);
    return Math.max(0, totalVerified - totalPengeluaran);
  }, [donasi, pengeluaran]);

  const totalMengendapPetugas = saldoPerPetugas.reduce((s, p) => s + p.mengendap, 0);
  const totalPendingPetugas = saldoPerPetugas.reduce((s, p) => s + p.totalPending, 0);
  const totalSaldoBank = Object.values(saldoPerMetode).reduce((s, v) => s + v, 0);
  const grandTotal = saldoBendahara + totalMengendapPetugas + totalPendingPetugas;

  const getExportFileName = () => {
    return `Posisi Saldo - ${formatTanggalDDMMYYYY(new Date().toISOString())}`;
  };

  const handleExport = () => {
    const headers = ['Keterangan', 'Nominal'];
    const csvData = [
      `"Saldo di Bendahara (Kas + Bank)",${totalSaldoBank}`,
      `"Saldo Mengendap di Petugas",${totalMengendapPetugas}`,
      `"Setoran Pending Verifikasi",${totalPendingPetugas}`
    ];
    
    // Add total row
    csvData.push(`"Total Posisi Dana",${grandTotal}`);
    
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
    
    const headers = [['KETERANGAN', 'NOMINAL']];
    const data = [
      ['Saldo di Bendahara (Kas + Bank)', formatRupiah(totalSaldoBank)],
      ['Saldo Mengendap di Petugas', formatRupiah(totalMengendapPetugas)],
      ['Setoran Pending Verifikasi', formatRupiah(totalPendingPetugas)]
    ];
    
    // Add total row
    data.push([
      { content: 'TOTAL POSISI DANA', styles: { fontStyle: 'bold' } }, 
      { content: formatRupiah(grandTotal), styles: { fontStyle: 'bold', halign: 'right' } }
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
        1: { halign: 'right' }
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
          doc.text('LAPORAN RINGKASAN POSISI SALDO', pageWidth / 2, 40, { align: 'center' });
          doc.text(`TANGGAL CETAK: ${formatTanggalDDMMYYYY(new Date().toISOString())}`, pageWidth / 2, 46, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bolditalic');
          doc.setTextColor(150, 150, 150);
          doc.text(`TANGGAL CETAK: ${formatTanggalDDMMYYYY(new Date().toISOString())}`, 14, 15);
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
        
        doc.text('LAPORAN RINGKASAN POSISI SALDO', 14, pageHeight - 10);
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

      {/* Grand Total */}
      <div className="saldo-card mb-lg">
        <div className="saldo-label">Total Posisi Dana Keseluruhan</div>
        <div className="saldo-amount">{formatRupiah(grandTotal)}</div>
        <div className="saldo-detail">
          <span>Bendahara + Petugas + Pending</span>
        </div>
      </div>

      {/* Section: Saldo Bendahara (per Sumber Dana) */}
      <div className="mb-xl">
        <div className="flex items-center gap-sm mb-md" style={{ paddingBottom: '8px', borderBottom: '2px solid var(--primary)20' }}>
          <Landmark size={20} color="var(--primary)" />
          <div>
            <h2 className="font-bold text-md" style={{ margin: 0 }}>Saldo di Bendahara (per Sumber Dana)</h2>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>Dana yang telah terverifikasi dikurangi pengeluaran</p>
          </div>
        </div>
        <div className="grid gap-sm" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {metodeDonasi.filter(m => m.aktif).map(m => (
            <div key={m.id} className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="flex items-center gap-sm mb-sm">
                <Wallet size={14} color="var(--text-secondary)" />
                <span className="text-sm text-secondary">{m.nama}</span>
              </div>
              <div className="font-bold text-lg" style={{ color: (saldoPerMetode[m.id] || 0) > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                {formatRupiah(saldoPerMetode[m.id] || 0)}
              </div>
            </div>
          ))}
        </div>
        <div className="card mt-sm" style={{ padding: 'var(--space-md)', background: 'var(--primary-bg)' }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Saldo Bendahara</span>
            <span className="font-bold text-lg text-primary-color">{formatRupiah(totalSaldoBank)}</span>
          </div>
        </div>
      </div>

      {/* Section: Saldo di Petugas */}
      <div className="mb-xl">
        <div className="flex items-center gap-sm mb-md" style={{ paddingBottom: '8px', borderBottom: '2px solid var(--warning)20' }}>
          <Users size={20} color="var(--warning)" />
          <div>
            <h2 className="font-bold text-md" style={{ margin: 0 }}>Saldo Mengendap di Petugas</h2>
            <p className="text-sm text-secondary" style={{ margin: 0 }}>Dana yang belum disetor oleh petugas ke bendahara</p>
          </div>
        </div>
        <div className="stagger">
          {saldoPerPetugas.map(p => (
            <div key={p.id} className="list-item" style={{ padding: '14px' }}>
              <div className="list-item-avatar" style={{ background: p.mengendap > 0 ? 'var(--warning-bg)' : 'var(--success-bg)', color: p.mengendap > 0 ? 'var(--warning)' : 'var(--success)' }}>
                {p.avatar}
              </div>
              <div className="list-item-content">
                <div className="list-item-title font-semibold">{p.name}</div>
                <div className="list-item-subtitle">
                  {p.mengendap > 0 ? (
                    <span className="flex items-center gap-xs" style={{ color: 'var(--warning)' }}>
                      <AlertTriangle size={12} /> Dana belum disetor
                    </span>
                  ) : (
                    <span style={{ color: 'var(--success)' }}>Semua dana telah disetor</span>
                  )}
                </div>
              </div>
              <div className="list-item-trailing text-right">
                <div className="font-bold" style={{ color: p.mengendap > 0 ? 'var(--warning)' : 'var(--success)' }}>
                  {formatRupiah(p.mengendap)}
                </div>
                {p.totalPending > 0 && (
                  <div className="text-xs text-tertiary">Pending: {formatRupiah(p.totalPending)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="card mt-sm" style={{ padding: 'var(--space-md)', background: 'var(--warning-bg)' }}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Total Mengendap di Petugas</span>
            <span className="font-bold text-lg" style={{ color: 'var(--warning)' }}>{formatRupiah(totalMengendapPetugas)}</span>
          </div>
        </div>
      </div>

      {/* Ringkasan Neraca */}
      <div className="card" style={{ padding: 'var(--space-lg)' }}>
        <h3 className="font-bold mb-md">Ringkasan Posisi Saldo</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Keterangan</th>
                <th className="text-right">Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Saldo di Bendahara (Kas + Bank)</td>
                <td className="text-right font-semibold text-primary-color">{formatRupiah(totalSaldoBank)}</td>
              </tr>
              <tr>
                <td>Saldo Mengendap di Petugas</td>
                <td className="text-right font-semibold" style={{ color: 'var(--warning)' }}>{formatRupiah(totalMengendapPetugas)}</td>
              </tr>
              <tr>
                <td>Setoran Pending Verifikasi</td>
                <td className="text-right font-semibold" style={{ color: 'var(--info)' }}>{formatRupiah(totalPendingPetugas)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border)' }}>
                <td className="font-bold">Total Posisi Dana</td>
                <td className="text-right font-bold text-lg text-primary-color">{formatRupiah(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
