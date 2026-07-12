'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { ArrowLeft, Save, MessageCircle } from 'lucide-react';

export default function PesanWaPage() {
  const router = useRouter();
  const { pesanWa, setPesanWa, showToast } = useData();
  const [template, setTemplate] = useState(pesanWa);

  const handleSubmit = (e) => {
    e.preventDefault();
    setPesanWa(template);
    showToast('Template Pesan WA berhasil disimpan');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-ghost btn-sm mb-md" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <h1>Master Pesan WA</h1>
        <p>Kelola format template Laporan Donasi via WhatsApp</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-lg">
            <label className="form-label">Template Teks</label>
            <textarea
              className="form-textarea"
              rows="6"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              required
            ></textarea>
            <div className="text-sm text-secondary" style={{ marginTop: '12px' }}>
              <strong>Variabel yang tersedia (akan diganti otomatis):</strong>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', marginTop: '8px' }}>
                <li><code>{'{nama}'}</code> - Nama Donatur</li>
                <li><code>{'{nominal}'}</code> - Jumlah Donasi (Rp)</li>
                <li><code>{'{kategori}'}</code> - Kategori Donasi</li>
                <li><code>{'{metode}'}</code> - Metode Donasi</li>
                <li><code>{'{tanggal}'}</code> - Tanggal Donasi</li>
              </ul>
            </div>
          </div>
          <div className="flex gap-sm">
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Simpan Template
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => {
                const dummyText = template
                  .replace('{nama}', 'Budi Santoso')
                  .replace('{nominal}', 'Rp 500.000')
                  .replace('{kategori}', 'Infaq')
                  .replace('{metode}', 'Transfer Bank BSI')
                  .replace('{tanggal}', '12-07-2026');
                window.open(`https://wa.me/?text=${encodeURIComponent(dummyText)}`, '_blank');
              }}
            >
              <MessageCircle size={16} /> Test Preview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
