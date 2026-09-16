'use client';

import { useData } from '@/contexts/DataContext';
import MasterDataPage from '@/components/MasterDataPage';
import { CreditCard } from 'lucide-react';

export default function MetodeDonasiPage() {
  const { metodeDonasi, addMetodeDonasi, updateMetodeDonasi, deleteMetodeDonasi } = useData();

  return (
    <MasterDataPage
      title="Metode Donasi"
      description="Kelola cara pembayaran donasi"
      items={metodeDonasi}
      icon={<CreditCard size={48} />}
      onAdd={addMetodeDonasi}
      onUpdate={updateMetodeDonasi}
      onDelete={deleteMetodeDonasi}
      fields={[
        { key: 'nama', label: 'Nama Metode', type: 'text', required: true },
        { key: 'deskripsi', label: 'Deskripsi', type: 'text', required: false },
      ]}
    />
  );
}
