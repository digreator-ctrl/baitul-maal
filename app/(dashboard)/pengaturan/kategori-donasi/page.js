'use client';

import { useData } from '@/contexts/DataContext';
import MasterDataPage from '@/components/MasterDataPage';
import { Tag } from 'lucide-react';

export default function KategoriDonasiPage() {
  const { kategoriDonasi, addKategoriDonasi, updateKategoriDonasi, deleteKategoriDonasi } = useData();

  return (
    <MasterDataPage
      title="Kategori Donasi"
      description="Kelola jenis-jenis donasi"
      items={kategoriDonasi}
      icon={<Tag size={48} />}
      onAdd={addKategoriDonasi}
      onUpdate={updateKategoriDonasi}
      onDelete={deleteKategoriDonasi}
      fields={[
        { key: 'nama', label: 'Nama Kategori', type: 'text', required: true },
        { key: 'deskripsi', label: 'Deskripsi', type: 'text', required: false },
      ]}
    />
  );
}
