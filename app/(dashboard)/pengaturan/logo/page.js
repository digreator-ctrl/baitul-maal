'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Trash2, Image } from 'lucide-react';

export default function LogoPage() {
  const router = useRouter();
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setLogo(null);
    setPreview(null);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.push('/pengaturan')} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Logo Lembaga</h1>
        <p>Kelola logo Ponpes Ar-Rosyad yang akan tampil di halaman login dan sidebar</p>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-lg">Logo Saat Ini</h3>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)' }}>
          <label className="logo-upload-area" htmlFor="logo-upload" style={{ width: 160, height: 160 }}>
            {preview ? (
              <img src={preview} alt="Logo preview" />
            ) : (
              <div className="upload-placeholder">
                <Image size={32} />
                <span>Upload Logo</span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>PNG, JPG max 2MB</span>
              </div>
            )}
          </label>
          <input
            type="file"
            id="logo-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <div className="flex gap-sm">
            <label htmlFor="logo-upload" className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
              <Upload size={16} /> Upload Logo
            </label>
            {preview && (
              <button className="btn btn-danger btn-sm" onClick={handleRemove}>
                <Trash2 size={16} /> Hapus
              </button>
            )}
          </div>

          <p className="text-sm text-tertiary text-center">
            Logo akan ditampilkan pada halaman login dan di sidebar navigasi.
            <br />Untuk tahap ini, upload logo bersifat sementara (di memori browser).
            <br />Storage permanen akan tersedia di Tahap 5 (Google Drive).
          </p>
        </div>
      </div>
    </div>
  );
}
