// ============================================
// RBAC — Role-Based Access Control
// ============================================

export function hasPermission(user, permission) {
  if (!user || !user.permissions || !permission) return false;
  return user.permissions.includes(permission);
}

export function isReadOnly(user) {
  // Simplification for UI checks, assuming 'petugas' or lack of create/edit means read-only.
  // A better way is checking specific create/edit permissions in components.
  if (!user || !user.permissions) return true;
  return !user.permissions.some(p => p.includes('.create') || p.includes('.edit') || p.includes('.delete') || p.includes('.setor') || p.includes('.pengeluaran') || p.includes('.verifikasi'));
}

// Navigation items with permission mapping
export function getNavItems(user) {
  const allItems = [
    {
      section: 'Utama',
      items: [
        {
          key: 'dashboard',
          label: 'Dashboard',
          href: '/dashboard',
          icon: 'LayoutDashboard',
          permission: 'dashboard.view',
        },
      ],
    },
    {
      section: 'Donatur',
      items: [
        {
          key: 'pendataan',
          label: 'Pendataan',
          href: '/pendataan',
          icon: 'Users',
          permission: 'donatur.view',
        },
      ],
    },
    {
      section: 'Transaksi',
      items: [
        {
          key: 'penerimaan',
          label: 'Penerimaan',
          href: '/penerimaan',
          icon: 'HandCoins',
          permission: 'donasi.view',
          children: [
            { label: 'Catat Donasi', href: '/penerimaan', permission: 'donasi.create' },
            { label: 'Setor ke Bendahara', href: '/penerimaan/setor', permission: 'donasi.setor' },
          ],
        },
        {
          key: 'keuangan',
          label: 'Keuangan',
          href: '/keuangan',
          icon: 'Landmark',
          permission: 'keuangan.view',
          children: [
            { label: 'Verifikasi Setoran', href: '/keuangan', permission: 'keuangan.verifikasi' },
            { label: 'Pengeluaran', href: '/keuangan/pengeluaran', permission: 'keuangan.pengeluaran' },
          ],
        },
      ],
    },
    {
      section: 'Analisis',
      items: [
        {
          key: 'laporan',
          label: 'Laporan',
          href: '/laporan',
          icon: 'BarChart3',
          permission: 'laporan.view',
          children: [
            { label: 'Pendapatan & Donatur', href: '/laporan/pendapatan', permission: 'laporan.penerimaan_donasi' },
            { label: 'Serah Terima Dana', href: '/laporan/serah-terima', permission: 'laporan.mutasi_setoran' },
            { label: 'Pengeluaran', href: '/laporan/pengeluaran', permission: 'laporan.realisasi_pengeluaran' },
            { label: 'Akuntansi & Keuangan', href: '/laporan/akuntansi', permission: 'laporan.buku_kas' },
          ],
        },
      ],
    },
    {
      section: 'Sistem',
      items: [
        {
          key: 'pengaturan',
          label: 'Pengaturan',
          href: '/pengaturan',
          icon: 'Settings',
          permission: 'pengaturan.view',
        },
      ],
    },
  ];

  // Filter sections and items based on role permissions
  return allItems
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasPermission(user, item.permission)),
    }))
    .filter(section => section.items.length > 0);
}

// Bottom nav items (max 5 + more)
export function getBottomNavItems(user) {
  const items = [];

  if (hasPermission(user, 'dashboard.view')) {
    items.push({ key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' });
  }
  if (hasPermission(user, 'donatur.view')) {
    items.push({ key: 'pendataan', label: 'Donatur', href: '/pendataan', icon: 'Users' });
  }
  if (hasPermission(user, 'donasi.view')) {
    items.push({ key: 'penerimaan', label: 'Donasi', href: '/penerimaan', icon: 'HandCoins' });
  }
  if (hasPermission(user, 'keuangan.view')) {
    items.push({ key: 'keuangan', label: 'Keuangan', href: '/keuangan', icon: 'Landmark' });
  }
  if (hasPermission(user, 'laporan.view')) {
    items.push({ key: 'laporan', label: 'Laporan', href: '/laporan', icon: 'BarChart3' });
  }

  // If more than 4, show 4 + "More" button
  if (items.length > 4) {
    return {
      visible: items.slice(0, 4),
      more: items.slice(4),
      hasMore: true,
    };
  }

  return { visible: items, more: [], hasMore: false };
}
