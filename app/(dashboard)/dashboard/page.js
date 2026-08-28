'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardPetugas } from './components/DashboardPetugas';
import { DashboardBendahara } from './components/DashboardBendahara';
import { DashboardPengawas } from './components/DashboardPengawas';
import { DashboardAdmin } from './components/DashboardAdmin';
import { DashboardSuperAdmin } from './components/DashboardSuperAdmin';

export default function DashboardPage() {
  const { user } = useAuth();

  // Determine user primary role
  const primaryRole = useMemo(() => {
    if (!user) return 'petugas';
    const userRoles = user.roles || (user.role ? [user.role] : []);
    
    if (userRoles.includes('superadmin')) return 'superadmin';
    if (userRoles.includes('bendahara')) return 'bendahara';
    if (userRoles.includes('pengawas')) return 'pengawas';
    if (userRoles.includes('admin')) return 'admin';
    if (userRoles.includes('petugas')) return 'petugas';

    return 'petugas';
  }, [user]);

  const roleLabel = useMemo(() => {
    switch (primaryRole) {
      case 'superadmin':
        return 'Super Admin';
      case 'bendahara':
        return 'Bendahara';
      case 'pengawas':
        return 'Dewan Pengawas & Pimpinan';
      case 'admin':
        return 'Admin Operasional';
      case 'petugas':
        return 'Petugas Lapangan';
      default:
        return 'Pengguna';
    }
  }, [primaryRole]);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="flex justify-between items-center flex-wrap gap-sm">
          <div>
            <h1>Dashboard</h1>
            <p>Assalamu&apos;alaikum, {user?.name || 'Pengguna'}! 👋</p>
          </div>
          <div className="badge badge-accent" style={{ fontSize: '12px', padding: '6px 12px' }}>
            Peran: {roleLabel}
          </div>
        </div>
      </div>

      {/* Render Role-Specific Dashboard */}
      {primaryRole === 'superadmin' && <DashboardSuperAdmin />}
      {primaryRole === 'bendahara' && <DashboardBendahara />}
      {primaryRole === 'pengawas' && <DashboardPengawas />}
      {primaryRole === 'admin' && <DashboardAdmin />}
      {primaryRole === 'petugas' && <DashboardPetugas />}
    </div>
  );
}
