'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/utils';
import { ChevronDown, ChevronUp, Plus, Clock, CheckCircle2, XCircle, HandCoins } from 'lucide-react';

export default function SetorPage() {
  const { user } = useAuth();
  const { donasi, setoran, metodeDonasi, createSetoran, showToast } = useData();
  const router = useRouter();
  
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    metodeDonasiId: '',
    nominal: '',
    keterangan: ''
  });
  const [errors, setErrors] = useState({});
  const [showRincian, setShowRincian] = useState(false);
  const rincianRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (rincianRef.current && !rincianRef.current.contains(event.target)) {
        setShowRincian(false);
      }
    }
    if (showRincian) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRincian]);

  // Hitung rekapitulasi per metode untuk petugas yang login
  const rekap = useMemo(() => {
    return metodeDonasi.filter(m => m.aktif).map(m => {
      let donasiMethod = donasi.filter(d => d.metodeId === m.id);
      if (user?.role === 'petugas') {
        donasiMethod = donasiMethod.filter(d => d.petugasId === user.id);
      }
      const totalTerkumpul = donasiMethod.reduce((sum, d) => sum + d.nominal, 0);

      let setoranMethod = setoran.filter(s => s.metodeDonasiId === m.id);
      if (user?.role === 'petugas') {
        setoranMethod = setoranMethod.filter(s => s.petugasId === user.id);
      }
      
      const totalMenunggu = setoranMethod.filter(s => s.status === 'menunggu_verifikasi').reduce((sum, s) => sum + s.totalNominal, 0);
      const totalDisetor = setoranMethod.filter(s => s.status === 'terverifikasi').reduce((sum, s) => sum + s.totalNominal, 0);
      
      const saldoTersedia = Math.max(0, totalTerkumpul - totalMenunggu - totalDisetor);

      return {
        ...m,
        saldoTersedia
      };
    });
  }, [metodeDonasi, donasi, setoran, user]);

  const totalAkumulasi = rekap.reduce((sum, r) => sum + r.saldoTersedia, 0);
  const metodeBerdasarkanSaldo = rekap.filter(r => r.saldoTersedia > 0);

  // Data Setoran Petugas
  const setoranPetugas = useMemo(() => {
    let list = setoran;
    if (user?.role === 'petugas') {
      list = list.filter(s => s.petugasId === user.id);
    }
    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [setoran, user]);

  const handleNominalChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, nominal: value }));
  };

  const formatNominalDisplay = (val) => {
    if (!val) return '';
    return parseInt(val).toLocaleString('id-ID');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.tanggal) newErrors.tanggal = true;
    if (!form.metodeDonasiId) newErrors.metodeDonasiId = true;
    if (!form.nominal) newErrors.nominal = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      showToast('Mohon lengkapi semua kolom yang wajib diisi', 'danger');
      return;
    }

    const nominalNum = parseInt(form.nominal);
    if (nominalNum <= 0) {
      showToast('Nominal harus lebih dari 0', 'danger');
      return;
    }

    const mRekap = rekap.find(r => r.id === form.metodeDonasiId);
    if (!mRekap || nominalNum > mRekap.saldoTersedia) {
      showToast(`Nominal melebihi saldo tersedia (Maks: ${formatRupiah(mRekap?.saldoTersedia || 0)})`, 'danger');
      setErrors({ nominal: true });
      return;
    }

    // Ambil ID donasi yang belum disetor dan sesuai dengan metode yang dipilih
    let donasiTerkait = donasi.filter(d => 
      d.metodeId === form.metodeDonasiId && 
      d.status === 'belum_disetor'
    );
    if (user?.role === 'petugas') {
      donasiTerkait = donasiTerkait.filter(d => d.petugasId === user.id);
    }
    const donasiIds = donasiTerkait.map(d => d.id);

    createSetoran(user?.id, form.tanggal, form.metodeDonasiId, form.nominal, form.keterangan, donasiIds);
    
    setForm({
      tanggal: new Date().toISOString().split('T')[0],
      metodeDonasiId: '',
      nominal: '',
      keterangan: ''
    });
    setErrors({});
    setShowModal(false);
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Setor ke Bendahara</h1>
            <p style={{ marginTop: '8px' }}>Rekapitulasi total dana donasi di tangan Anda.</p>
          </div>
          <div className="page-header-actions flex gap-xs flex-wrap">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} /> Buat Setoran Baru
            </button>
          </div>
        </div>
      </div>

      {/* Single Summary Card */}
      <div 
        ref={rincianRef}
        className="card mb-lg animate-scale" 
        style={{ 
          background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer'
        }}
        onClick={() => setShowRincian(!showRincian)}
      >
        {/* Dekorasi Card */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
          <div>
            <h3 className="font-semibold mb-sm" style={{ opacity: 0.9 }}>Saldo Terkini</h3>
            <div className="font-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>
              {formatRupiah(totalAkumulasi)}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: 'white', background: 'rgba(255,255,255,0.2)' }}>
            {showRincian ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showRincian && (
          <div style={{ marginTop: '24px', animation: 'fadeIn 0.2s ease-in-out', position: 'relative', zIndex: 1 }}>
            <h4 className="font-semibold mb-sm" style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)', paddingBottom: '8px', opacity: 0.9 }}>
              Rincian Sumber Metode Donasi
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rekap.length > 0 ? (
                rekap.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', opacity: 0.8 }} />
                      <span style={{ opacity: 0.9 }}>{r.nama}</span>
                    </div>
                    <span className="font-medium text-lg" style={{ fontStyle: 'italic' }}>{formatRupiah(r.saldoTersedia)}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm italic" style={{ padding: '8px 0', opacity: 0.8 }}>
                  Tidak ada metode donasi yang aktif.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Data Setoran */}
      <h3 className="font-bold mb-md">Data Pengajuan Setoran</h3>
      <div className="stagger">
        {setoranPetugas.length === 0 ? (
          <div className="empty-state">
            <HandCoins size={48} />
            <h3>Belum ada setoran</h3>
            <p>Anda belum pernah mengajukan setoran ke bendahara.</p>
          </div>
        ) : (
          setoranPetugas.map(s => {
            const met = metodeDonasi.find(m => m.id === s.metodeDonasiId);
            const status = getStatusBadge(s.status);
            return (
              <div 
                key={s.id} 
                className="list-item" 
                style={{ display: 'block', padding: '16px', cursor: 'pointer' }}
                onClick={() => router.push(`/penerimaan/setor/${s.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div className="list-item-subtitle" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(s.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}
                  </div>
                  <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.75rem' }}>{status.label}</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="list-item-title" style={{ fontSize: '1rem' }}>{met?.nama || 'Setoran'}</div>
                  <div className="list-item-value" style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatRupiah(s.totalNominal)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Setor Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Buat Setoran Baru</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal Setoran *</label>
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
                  <label className="form-label">Sumber Metode Donasi *</label>
                  <select 
                    className="form-select" 
                    value={form.metodeDonasiId} 
                    onChange={(e) => setForm(prev => ({ ...prev, metodeDonasiId: e.target.value }))} 
                    style={{ borderColor: errors.metodeDonasiId ? 'var(--danger)' : undefined }}
                  >
                    <option value="">-- Pilih Metode --</option>
                    {rekap.map(r => (
                      <option key={r.id} value={r.id} disabled={r.saldoTersedia <= 0}>
                        {r.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Saldo Saat Ini</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.metodeDonasiId ? formatRupiah(rekap.find(r => r.id === form.metodeDonasiId)?.saldoTersedia || 0) : '-'} 
                    readOnly
                    style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Setoran (Rp) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="0" 
                    value={formatNominalDisplay(form.nominal)} 
                    onChange={handleNominalChange} 
                    style={{ borderColor: errors.nominal ? 'var(--danger)' : undefined }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Keterangan (Opsional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Contoh: Titip lewat satpam" 
                    value={form.keterangan} 
                    onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))} 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Ajukan Setoran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowModal(true)} style={{ display: 'none' }}>
        <Plus size={24} />
      </button>

      <style jsx>{`
        @media (max-width: 1024px) {
          .fab { display: flex !important; }
          .page-header-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}
