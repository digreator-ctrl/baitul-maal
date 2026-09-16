'use client';

import { useData } from '@/contexts/DataContext';
import MasterDataPage from '@/components/MasterDataPage';
import { FolderOpen } from 'lucide-react';

export default function PosPengeluaranPage() {
  const { posPengeluaran, addPosPengeluaran, updatePosPengeluaran, deletePosPengeluaran } = useData();

  return (
    <MasterDataPage
      title="Pos Pengeluaran"
      description="Kelola jenis-jenis pengeluaran"
      items={posPengeluaran}
      icon={<FolderOpen size={48} />}
      onAdd={addPosPengeluaran}
      onUpdate={updatePosPengeluaran}
      onDelete={deletePosPengeluaran}
      fields={[
        { key: 'nama', label: 'Nama Pos', type: 'text', required: true },
        { key: 'deskripsi', label: 'Deskripsi', type: 'text', required: false },
      ]}
    />
  );
}
