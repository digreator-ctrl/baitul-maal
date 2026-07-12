'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { Settings, Tag, CreditCard, FolderOpen, Users, Image, MessageCircle } from 'lucide-react';

export default function PengaturanPage() {
  const { user } = useAuth();
  const { kategoriDonasi, metodeDonasi, posPengeluaran, roles, users } = useData();
  const router = useRouter();

  const menuItems = [
    {
      key: 'kategori-donasi',
      label: 'Master Kategori Donasi',
      description: `${kategoriDonasi.length} kategori`,
      icon: <Tag size={22} />,
      href: '/pengaturan/kategori-donasi',
      permission: 'pengaturan.kategori_donasi',
      color: 'green',
    },
    {
      key: 'metode-donasi',
      label: 'Master Metode Donasi',
      description: `${metodeDonasi.length} metode`,
      icon: <CreditCard size={22} />,
      href: '/pengaturan/metode-donasi',
      permission: 'pengaturan.metode_donasi',
      color: 'blue',
    },
    {
      key: 'pos-pengeluaran',
      label: 'Master Pos Pengeluaran',
      description: `${posPengeluaran.length} pos`,
      icon: <FolderOpen size={22} />,
      href: '/pengaturan/pos-pengeluaran',
      permission: 'pengaturan.pos_pengeluaran',
      color: 'gold',
    },
    {
      key: 'roles',
      label: 'Manajemen Role',
      description: `${roles.length} role`,
      icon: <Users size={22} />,
      href: '/pengaturan/role',
      permission: 'pengaturan.roles',
      color: 'purple',
    },
    {
      key: 'pengguna',
      label: 'Manajemen Pengguna',
      description: `${users.length} pengguna`,
      icon: <Users size={22} />,
      href: '/pengaturan/pengguna',
      permission: 'pengaturan.users',
      color: 'red',
    },
    {
      key: 'logo',
      label: 'Logo Lembaga',
      description: 'Kelola logo Ponpes Ar-Rosyad',
      icon: <Image size={22} />,
      href: '/pengaturan/logo',
      permission: 'pengaturan.logo',
      color: 'green',
    },
    {
      key: 'pesan-wa',
      label: 'Master Pesan WA',
      description: 'Kustomisasi template Laporan WA',
      icon: <MessageCircle size={22} />,
      href: '/pengaturan/pesan-wa',
      permission: 'pengaturan.view', // General access, or specific if needed
      color: 'green',
    },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <h1>Pengaturan</h1>
        <p>Kelola master data dan konfigurasi sistem</p>
      </div>

      <div className="stagger">
        {menuItems
          .filter(item => hasPermission(user, item.permission))
          .map(item => (
            <div key={item.key} className="list-item" onClick={() => router.push(item.href)}>
              <div className="list-item-avatar" style={{
                background: `var(--${item.color === 'green' ? 'primary' : item.color === 'blue' ? 'info' : item.color === 'gold' ? 'warning' : 'danger'}-bg, var(--primary-bg))`,
                color: `var(--${item.color === 'green' ? 'primary' : item.color === 'blue' ? 'info' : item.color === 'gold' ? 'warning' : 'danger'}, var(--primary))`,
              }}>
                {item.icon}
              </div>
              <div className="list-item-content">
                <div className="list-item-title">{item.label}</div>
                <div className="list-item-subtitle">{item.description}</div>
              </div>
              <div style={{ color: 'var(--text-tertiary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
