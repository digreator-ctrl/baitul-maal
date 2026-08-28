'use client';

import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { Wrench } from 'lucide-react';

export function Aktivitas() {
  const { user } = useAuth();

  if (!hasPermission(user, 'laporan.aktivitas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="card text-center" style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <div style={{ background: 'var(--primary-bg)', padding: '24px', borderRadius: '50%', color: 'var(--primary)' }}>
          <Wrench size={48} />
        </div>
        <h2 className="font-bold text-2xl">Laporan Aktivitas Keuangan</h2>
        <div className="badge badge-warning mb-sm">Masih Tahap Pengembangan</div>
        <p className="text-secondary" style={{ maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
          Halaman laporan ini sedang dalam tahap pengembangan dan perancangan. Kami sedang menyesuaikan format laporan aktivitas (Arus Kas / Pendapatan & Beban) agar lebih relevan dengan pencatatan operasional Baitul Maal.
        </p>
      </div>
    </div>
  );
}
