'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/lib/rbac';
import { RealisasiPengeluaran } from './components/RealisasiPengeluaran';
import { Send } from 'lucide-react';

export default function LaporanPengeluaranPage() {
  const { user } = useAuth();
  
  const availableTabs = useMemo(() => {
    const tabs = [];
    if (hasPermission(user, 'laporan.realisasi_pengeluaran')) {
      tabs.push({ id: 'realisasi', label: 'Realisasi Penyaluran', icon: <Send size={16} /> });
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
        <h1>Pengeluaran Dana</h1>
        <p>Rincian penyaluran dan pengeluaran operasional</p>
        
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
        {activeTab === 'realisasi' && <RealisasiPengeluaran />}
      </div>
    </div>
  );
}
