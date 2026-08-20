'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { BukuKas } from './components/BukuKas';
import { PosisiSaldo } from './components/PosisiSaldo';
import { Aktivitas } from './components/Aktivitas';
import { BookText, PiggyBank, Activity } from 'lucide-react';

export default function LaporanAkuntansiPage() {
  const { user } = useAuth();
  
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (hasPermission(user, 'laporan.buku_kas')) {
      tabs.push({ id: 'buku_kas', label: 'Buku Kas & Bank', icon: <BookText size={16} /> });
    }
    if (hasPermission(user, 'laporan.posisi_saldo')) {
      tabs.push({ id: 'posisi_saldo', label: 'Posisi Saldo', icon: <PiggyBank size={16} /> });
    }
    if (hasPermission(user, 'laporan.aktivitas')) {
      tabs.push({ id: 'aktivitas', label: 'Aktivitas', icon: <Activity size={16} /> });
    }
    return tabs;
  }, [user]);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || '');

  if (availableTabs.length === 0) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ paddingBottom: 0 }}>
        <h1>Akuntansi & Keuangan</h1>
        <p>Laporan neraca, arus kas, dan aktivitas keuangan</p>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '24px', borderBottom: '1px solid var(--border)' }}>
          {availableTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '12px 0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '500',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                marginBottom: '-1px'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ paddingTop: '24px' }}>
        {activeTab === 'buku_kas' && <BukuKas />}
        {activeTab === 'posisi_saldo' && <PosisiSaldo />}
        {activeTab === 'aktivitas' && <Aktivitas />}
      </div>
    </div>
  );
}
