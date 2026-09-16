'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { hasPermission } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort } from '@/lib/utils';
import { ArrowLeft, User, Calendar, MapPin, HandCoins, Info, Edit, Trash2, MessageCircle } from 'lucide-react';

export default function DetailDonasiPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, pesanWa, updateDonasi, deleteDonasi, showToast } = useData();
  
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  // Helper for nominal formatting
  const handleNominalChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, nominal: value }));
  };

  const formatNominalDisplay = (val) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const dataDonasi = donasi.find(d => d.id === id);

  if (!dataDonasi) {
    return (
      <div className="animate-fade-in-up">
        <div className="page-header">
          <button className="btn btn-ghost btn-sm mb-md" onClick={() => router.back()}>
            <ArrowLeft size={16} /> Kembali
          </button>
          <h1>Data tidak ditemukan</h1>
        </div>
      </div>
    );
  }

  const donaturInfo = donatur.find(d => d.id === dataDonasi.donaturId);
  const kategori = kategoriDonasi.find(k => k.id === dataDonasi.kategoriId);
  const metode = metodeDonasi.find(m => m.id === dataDonasi.metodeId);
  
  const openEdit = () => {
    setForm({
      kategoriDonasiId: dataDonasi.kategoriId,
      metodeDonasiId: dataDonasi.metodeId,
      nominal: dataDonasi.nominal,
      tanggal: dataDonasi.tanggal ? String(dataDonasi.tanggal).split('T')[0] : ''
    });
    setShowEdit(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.tanggal) newErrors.tanggal = true;
    if (!form.kategoriDonasiId) newErrors.kategoriDonasiId = true;
    if (!form.metodeDonasiId) newErrors.metodeDonasiId = true;
    if (!form.nominal) newErrors.nominal = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Mohon lengkapi semua kolom yang wajib diisi', 'danger');
      return;
    }
    
    updateDonasi(id, { ...form, nominal: parseInt(form.nominal) });
    setErrors({});
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteDonasi(id);
    setShowDelete(false);
    router.replace('/penerimaan');
  };

  const sendWa = () => {
    if (!donaturInfo?.noWa) {
      showToast('No WhatsApp donatur tidak tersedia', 'danger');
      return;
    }
    const noWa = donaturInfo.noWa.replace(/^0/, '62');
    const msg = pesanWa
      .replace('{nama}', donaturInfo.nama)
      .replace('{nominal}', formatRupiah(dataDonasi.nominal))
      .replace('{kategori}', kategori?.nama || '')
      .replace('{metode}', metode?.nama || '')
      .replace('{tanggal}', formatTanggalShort(dataDonasi.tanggal));
    
    // updateDonasi(id, { laporanTerkirim: true }); // Field doesn't exist in Prisma schema
    
    window.open(`https://wa.me/${noWa}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const canDelete = user?.roles?.includes('superadmin') || user?.roles?.includes('admin');

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-ghost btn-sm mb-md" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ marginBottom: 0 }}>Detail Donasi</h1>
            {dataDonasi.status === 'terverifikasi' ? (
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Terverifikasi</span>
            ) : (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 8px' }}>Belum Disetor</span>
            )}
          </div>
          <div className="flex gap-xs flex-wrap">
            <button className="btn btn-success btn-sm" onClick={sendWa}>
              <MessageCircle size={14} /> Laporan WA
            </button>
            {hasPermission(user, 'donasi.create') && (
              <button className="btn btn-secondary btn-sm" onClick={openEdit}>
                <Edit size={14} /> Edit
              </button>
            )}
            {canDelete && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                <Trash2 size={14} /> Hapus
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-lg">
        <h3 className="font-semibold mb-md border-b" style={{ paddingBottom: '12px', borderColor: 'var(--border)' }}>Informasi Donatur</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex gap-sm">
            <User size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="text-sm text-secondary">Nama Donatur</div>
              <div className="font-medium">{donaturInfo?.nama || '-'}</div>
            </div>
          </div>
          <div className="flex gap-sm">
            <MapPin size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="text-sm text-secondary">Wilayah</div>
              <div>{donaturInfo?.provinsi ? `${donaturInfo.provinsi} - ${donaturInfo.kota} - ${donaturInfo.kecamatan} - ${donaturInfo.kelurahan}` : '-'}</div>
              
              <div className="text-sm text-secondary" style={{ marginTop: '12px' }}>Alamat</div>
              <div>{donaturInfo?.alamat || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-md border-b" style={{ paddingBottom: '12px', borderColor: 'var(--border)' }}>Rincian Donasi</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="flex gap-sm">
            <Calendar size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="text-sm text-secondary">Tanggal Donasi</div>
              <div className="font-medium">{formatTanggalShort(dataDonasi.tanggal)}</div>
            </div>
          </div>
          <div className="flex gap-sm">
            <HandCoins size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="text-sm text-secondary">Kategori Donasi</div>
              <div className="font-medium">{kategori?.nama || '-'}</div>
            </div>
          </div>
          <div className="flex gap-sm">
            <Info size={18} color="var(--text-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div className="text-sm text-secondary">Metode Pembayaran</div>
              <div>{metode?.nama || '-'}</div>
            </div>
          </div>
          <div className="flex gap-sm">
            <div style={{ width: '18px', flexShrink: 0 }} /> {/* Spacer */}
            <div>
              <div className="text-sm text-secondary">Nominal</div>
              <div className="font-bold text-primary" style={{ fontSize: '1.5rem' }}>{formatRupiah(dataDonasi.nominal)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && form && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Donasi</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowEdit(false)}>✕</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.tanggal} 
                    onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))} 
                    onClick={(e) => e.target.showPicker()}
                    style={{ borderColor: errors.tanggal ? 'var(--danger)' : undefined }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Donatur</label>
                  <input type="text" className="form-input" value={donaturInfo?.nama || '-'} disabled />
                  <span className="form-hint">Donatur tidak dapat diubah setelah dicatat.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori Donasi *</label>
                  <select 
                    className="form-select" 
                    value={form.kategoriDonasiId} 
                    onChange={(e) => setForm(prev => ({ ...prev, kategoriDonasiId: e.target.value }))} 
                    style={{ borderColor: errors.kategoriDonasiId ? 'var(--danger)' : undefined }}
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriDonasi.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Metode Donasi *</label>
                  <select 
                    className="form-select" 
                    value={form.metodeDonasiId} 
                    onChange={(e) => setForm(prev => ({ ...prev, metodeDonasiId: e.target.value }))} 
                    style={{ borderColor: errors.metodeDonasiId ? 'var(--danger)' : undefined }}
                  >
                    <option value="">-- Pilih Metode --</option>
                    {metodeDonasi.map(m => (
                      <option key={m.id} value={m.id}>{m.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal (Rp) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="0" 
                    value={formatNominalDisplay(form.nominal)} 
                    onChange={handleNominalChange} 
                    style={{ borderColor: errors.nominal ? 'var(--danger)' : undefined }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEdit(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Perubahan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <div className="modal-overlay" onClick={() => setShowDelete(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Hapus Donasi</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDelete(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Apakah Anda yakin ingin menghapus data donasi ini? Data yang sudah dihapus tidak dapat dikembalikan.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDelete(false)}>Batal</button>
              <button className="btn btn-danger" onClick={handleDelete}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
