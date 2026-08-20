'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { Loader2 } from 'lucide-react';

export default function LaporanRedirectPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Find the first report category the user has access to
    if (hasPermission(user, 'laporan.penerimaan_donasi') || hasPermission(user, 'laporan.kolektabilitas')) {
      router.replace('/laporan/pendapatan');
    } else if (hasPermission(user, 'laporan.mutasi_setoran')) {
      router.replace('/laporan/serah-terima');
    } else if (hasPermission(user, 'laporan.realisasi_pengeluaran')) {
      router.replace('/laporan/pengeluaran');
    } else if (hasPermission(user, 'laporan.buku_kas') || hasPermission(user, 'laporan.posisi_saldo') || hasPermission(user, 'laporan.aktivitas')) {
      router.replace('/laporan/akuntansi');
    } else {
      // No permissions
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '16px' }}>
      <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
      <p className="text-secondary text-sm">Mengalihkan ke laporan...</p>
    </div>
  );
}
