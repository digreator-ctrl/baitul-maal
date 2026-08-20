'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { PenerimaanDonasi } from './components/PenerimaanDonasi';
import { Kolektabilitas } from './components/Kolektabilitas';
import { HandCoins, Users } from 'lucide-react';

export default function LaporanPendapatanPage() {
  const { user } = useAuth();
  
  // Define available tabs based on permissions
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (hasPermission(user, 'laporan.penerimaan_donasi')) {
      tabs.push({ id: 'penerimaan', label: 'Penerimaan Donasi', icon: <HandCoins size={16} /> });
    }
    if (hasPermission(user, 'laporan.kolektabilitas')) {
      tabs.push({ id: 'kolektabilitas', label: 'Kolektabilitas', icon: <Users size={16} /> });
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
        <h1>Pendapatan & Donatur</h1>
        <p>Laporan terkait penerimaan donasi dan aktivitas donatur</p>
        
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
        {activeTab === 'penerimaan' && <PenerimaanDonasi />}
        {activeTab === 'kolektabilitas' && <Kolektabilitas />}
      </div>
    </div>
  );
}
