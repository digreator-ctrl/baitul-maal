'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, FileText, Wallet, ArrowRight, 
  Users, HandCoins, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { useMemo } from 'react';

function LaporanPetugas() {
  const { user } = useAuth();
  const { donasi, setoran } = useData();

  const stats = useMemo(() => {
    const myDonasi = donasi.filter(d => d.petugasId === user?.id);
    const totalDonasi = myDonasi.reduce((sum, d) => sum + d.nominal, 0);
    const jumlahDonatur = new Set(myDonasi.map(d => d.donaturId)).size;
    const mySetoran = setoran.filter(s => s.petugasId === user?.id);
    
    return {
      totalDonasi,
      jumlahDonatur,
      mySetoran: mySetoran.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
    };
  }, [donasi, setoran, user]);

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="page-header">
        <h1>Laporan Kinerja Anda</h1>
        <p>Ringkasan aktivitas penghimpunan dan setoran Anda</p>
      </div>

      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="flex items-center gap-sm mb-sm text-secondary">
            <HandCoins size={18} />
            <span className="font-semibold">Total Penghimpunan</span>
          </div>
          <div className="text-2xl font-bold text-primary-color">{formatRupiah(stats.totalDonasi)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="flex items-center gap-sm mb-sm text-secondary">
            <Users size={18} />
            <span className="font-semibold">Donatur Dilayani</span>
          </div>
          <div className="text-2xl font-bold">{stats.jumlahDonatur} orang</div>
        </div>
      </div>

      <h3 className="font-semibold mb-md text-lg">Riwayat Setoran Anda</h3>
      <div className="stagger">
        {stats.mySetoran.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>Belum ada riwayat setoran</h3>
          </div>
        ) : (
          stats.mySetoran.map(s => {
            const status = getStatusBadge(s.status);
            return (
              <div key={s.id} className="list-item" style={{ padding: '16px' }}>
                <div className="list-item-content">
                  <div className="list-item-title font-semibold text-md mb-xs">{s.keterangan || 'Setoran Dana'}</div>
                  <div className="list-item-subtitle flex items-center gap-xs">
                    <Clock size={12} /> {formatTanggalShort(s.tanggal)}
                  </div>
                </div>
                <div className="list-item-trailing text-right">
                  <div className="font-bold text-md mb-xs">{formatRupiah(s.totalNominal)}</div>
                  <div className="list-item-meta">
                    <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.75rem' }}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LaporanBendahara() {
  const router = useRouter();

  const menus = [
    {
      title: 'Buku Kas Umum (Mutasi)',
      desc: 'Laporan arus kas masuk dan keluar secara kronologis beserta saldo berjalan.',
      icon: <Wallet size={24} color="var(--primary)" />,
      path: '/laporan/mutasi',
      bg: 'var(--primary-bg)'
    },
    {
      title: 'Penerimaan per Kategori',
      desc: 'Laporan rinci penerimaan donasi berdasarkan kategori (Zakat, Infaq, dll).',
      icon: <BarChart3 size={24} color="var(--success)" />,
      path: '/laporan/penerimaan',
      bg: 'var(--success-bg)'
    },
    {
      title: 'Realisasi Pengeluaran',
      desc: 'Laporan rinci penggunaan dana berdasarkan pos-pos pengeluaran.',
      icon: <FileText size={24} color="var(--danger)" />,
      path: '/laporan/penggunaan',
      bg: 'var(--danger-bg)'
    }
  ];

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="page-header">
        <h1>Pusat Laporan</h1>
        <p>Akses berbagai modul laporan keuangan lembaga</p>
      </div>

      <div className="grid gap-md" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        {menus.map((m, i) => (
          <div 
            key={i} 
            className="card cursor-pointer"
            onClick={() => router.push(m.path)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              transition: 'all 0.2s ease',
              border: '1px solid var(--border)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <div>
              <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '12px', background: m.bg, marginBottom: '16px' }}>
                {m.icon}
              </div>
              <h3 className="font-bold mb-xs text-lg">{m.title}</h3>
              <p className="text-sm text-secondary line-clamp-2" style={{ lineHeight: '1.5' }}>{m.desc}</p>
            </div>
            <div className="flex items-center gap-xs mt-lg text-sm font-semibold" style={{ color: 'var(--primary)' }}>
              Buka Laporan <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const { user } = useAuth();
  
  if (user?.role === 'petugas') {
    return <LaporanPetugas />;
  }
  
  return <LaporanBendahara />;
}
