'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, formatTanggalDDMMYYYY } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { ArrowUpRight, ArrowDownRight, BookOpen, Wallet, Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function BukuKas() {
  const { user } = useAuth();
  const { donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, getSaldoPerMetode } = useData();
  const [filterSumber, setFilterSumber] = useState('semua');

  if (!hasPermission(user, 'laporan.buku_kas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

  const mutations = useMemo(() => {
    const items = [];

    // Verified donations as income
    donasi.filter(d => d.status === 'terverifikasi').forEach(d => {
      const don = donatur.find(x => x.id === d.donaturId);
      const met = metodeDonasi.find(m => m.id === d.metodeDonasiId);
      const kat = kategoriDonasi.find(k => k.id === d.kategoriDonasiId);
      items.push({
        id: d.id, tanggal: d.tanggal, type: 'masuk', nominal: d.nominal,
        metode: met?.nama || '-', metodeId: d.metodeDonasiId,
        keterangan: `${don?.nama || '-'} — ${kat?.nama || '-'}`,
      });
    });

    // Expenses as outflow
    pengeluaran.forEach(p => {
      const met = metodeDonasi.find(m => m.id === p.sumberDanaId);
      const pos = posPengeluaran.find(x => x.id === p.posPengeluaranId);
      items.push({
        id: p.id, tanggal: p.tanggal, type: 'keluar', nominal: p.nominal,
        metode: met?.nama || '-', metodeId: p.sumberDanaId,
        keterangan: `${pos?.nama || '-'}${p.keterangan ? ' — ' + p.keterangan : ''}`,
      });
    });

    // Filter by sumber dana
    const filtered = filterSumber === 'semua' 
      ? items 
      : items.filter(i => i.metodeId === filterSumber);

    return filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, pengeluaran, donatur, metodeDonasi, kategoriDonasi, posPengeluaran, filterSumber]);

  // Build running balance
  const mutationsWithBalance = useMemo(() => {
    const sorted = [...mutations].sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
    let runningTotal = 0;
    const withBalance = sorted.map(m => {
      runningTotal += m.type === 'masuk' ? m.nominal : -m.nominal;
      return { ...m, balance: Math.max(0, runningTotal) };
    });
    return withBalance.reverse();
  }, [mutations]);

  const totalMasuk = mutations.filter(m => m.type === 'masuk').reduce((s, m) => s + m.nominal, 0);
  const totalKeluar = mutations.filter(m => m.type === 'keluar').reduce((s, m) => s + m.nominal, 0);

  const getExportFileName = () => {
    let sumberStr = 'Semua Sumber Dana';
    if (filterSumber !== 'semua') {
      sumberStr = metodeDonasi.find(m => m.id === filterSumber)?.nama || 'Semua Sumber Dana';
    }
    return `Buku Kas - ${sumberStr}`;
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
    
    const headers = [['NO', 'TANGGAL', 'KETERANGAN', 'METODE', 'JENIS MUTASI', 'NOMINAL', 'SALDO']];
    const data = mutationsWithBalance.map((m, i) => {
      return [
        i + 1,
        formatTanggalDDMMYYYY(m.tanggal),
        m.keterangan,
        m.metode,
        m.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        formatRupiah(m.nominal),
        formatRupiah(m.balance)
      ];
    });
    
    // Add total rows
    data.push([
      { content: 'TOTAL PEMASUKAN', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      { content: formatRupiah(totalMasuk), styles: { fontStyle: 'bold', halign: 'right' } },
      ''
    ]);
    data.push([
      { content: 'TOTAL PENGELUARAN', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
      { content: formatRupiah(totalKeluar), styles: { fontStyle: 'bold', halign: 'right' } },
      ''
    ]);
    data.push([
      { content: 'SALDO AKHIR', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }, 
      { content: formatRupiah(Math.max(0, totalMasuk - totalKeluar)), styles: { fontStyle: 'bold', halign: 'right' } }
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
          doc.text('LAPORAN BUKU KAS', pageWidth / 2, 40, { align: 'center' });
          doc.text(`SUMBER DANA: ${sumberStr.toUpperCase()}`, pageWidth / 2, 46, { align: 'center' });
        } else {
          // Header subsequent pages
          doc.setFontSize(10);
          doc.setFont('helvetica', 'bolditalic');
          doc.setTextColor(150, 150, 150);
          doc.text(`SUMBER DANA: ${sumberStr.toUpperCase()}`, 14, 15);
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

      {/* Saldo per Sumber Dana */}
      <div className="grid gap-sm mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
        {metodeDonasi.filter(m => m.aktif).map(m => (
          <div 
            key={m.id} 
            className="card cursor-pointer" 
            onClick={() => setFilterSumber(filterSumber === m.id ? 'semua' : m.id)}
            style={{ 
              padding: 'var(--space-md)',
              border: filterSumber === m.id ? '2px solid var(--primary)' : '1px solid var(--border)',
              transition: 'all 0.2s ease',
            }}
          >
            <div className="flex items-center gap-sm mb-sm">
              <Wallet size={14} color="var(--text-secondary)" />
              <span className="text-sm text-secondary">{m.nama}</span>
            </div>
            <div className="font-bold" style={{ color: (saldo[m.id] || 0) > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
              {formatRupiah(saldo[m.id] || 0)}
            </div>
            {filterSumber === m.id && (
              <div className="text-xs mt-xs" style={{ color: 'var(--primary)' }}>● Sedang difilter</div>
            )}
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <div>
            <div className="text-sm text-secondary">Total Masuk</div>
            <div className="font-bold text-lg" style={{ color: 'var(--success)' }}>+{formatRupiah(totalMasuk)}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Total Keluar</div>
            <div className="font-bold text-lg" style={{ color: 'var(--danger)' }}>-{formatRupiah(totalKeluar)}</div>
          </div>
          <div>
            <div className="text-sm text-secondary">Saldo Akhir</div>
            <div className="font-bold text-lg text-primary-color">{formatRupiah(Math.max(0, totalMasuk - totalKeluar))}</div>
          </div>
        </div>
      </div>

      {filterSumber !== 'semua' && (
        <div className="mb-md">
          <button className="btn btn-ghost text-sm" onClick={() => setFilterSumber('semua')}>
            ✕ Hapus filter sumber dana
          </button>
        </div>
      )}

      {/* Mutation Timeline */}
      <div className="stagger">
        {mutationsWithBalance.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3>Belum Ada Mutasi</h3>
            <p>Belum ada transaksi yang tercatat.</p>
          </div>
        ) : (
          mutationsWithBalance.map(m => (
            <div key={m.id} className="list-item">
              <div className="list-item-avatar" style={{
                background: m.type === 'masuk' ? 'var(--success-bg)' : 'var(--danger-bg)',
                color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)',
              }}>
                {m.type === 'masuk' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
              <div className="list-item-content">
                <div className="list-item-title text-sm">{m.keterangan}</div>
                <div className="list-item-subtitle">{m.metode} · {formatTanggalShort(m.tanggal)}</div>
              </div>
              <div className="list-item-trailing">
                <div className="font-bold text-sm" style={{ color: m.type === 'masuk' ? 'var(--success)' : 'var(--danger)' }}>
                  {m.type === 'masuk' ? '+' : '-'}{formatRupiah(m.nominal)}
                </div>
                <div className="list-item-meta">Saldo: {formatRupiah(m.balance)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
