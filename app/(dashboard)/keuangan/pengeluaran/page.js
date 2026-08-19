'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { isReadOnly } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, Plus, Minus, Wallet, ChevronDown, ChevronUp } from 'lucide-react';

export default function PengeluaranPage() {
  const { user } = useAuth();
  const { pengeluaran, metodeDonasi, posPengeluaran, addPengeluaran, setoran } = useData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [showRincian, setShowRincian] = useState(false);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sumberDanaId: '', posPengeluaranId: '', nominal: '', keterangan: '',
  });

  const readOnly = isReadOnly(user);
  
  // Hitung saldo yang telah diterima oleh Bendahara (hanya status terverifikasi) dikurangi pengeluaran
  const rekap = useMemo(() => {
    return metodeDonasi.filter(m => m.aktif).map(m => {
      const totalDiterima = setoran
        .filter(s => s.status === 'terverifikasi' && s.metodeDonasiId === m.id)
        .reduce((sum, s) => sum + s.totalNominal, 0);
      
      const totalKeluar = pengeluaran
        .filter(p => p.sumberDanaId === m.id)
        .reduce((sum, p) => sum + p.nominal, 0);

      return {
        ...m,
        saldoTersedia: totalDiterima - totalKeluar
      };
    });
  }, [metodeDonasi, setoran, pengeluaran]);

  const totalAkumulasi = rekap.reduce((sum, r) => sum + r.saldoTersedia, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sumberDanaId || !form.posPengeluaranId || !form.nominal) return;
    const selectedSaldo = saldo[form.sumberDanaId] || 0;
    if (parseInt(form.nominal) > selectedSaldo) {
      alert('Nominal melebihi saldo yang tersedia!');
      return;
    }
    addPengeluaran({ ...form, nominal: parseInt(form.nominal), createdBy: user?.id });
    setForm({ tanggal: new Date().toISOString().split('T')[0], sumberDanaId: '', posPengeluaranId: '', nominal: '', keterangan: '' });
    setShowForm(false);
  };

  const sortedPengeluaran = useMemo(() => {
    return [...pengeluaran].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [pengeluaran]);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Catat Pengeluaran</h1>
        <p>Penggunaan dana donasi untuk kebutuhan lembaga</p>
        {!readOnly && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} /> Catat Pengeluaran
            </button>
          </div>
        )}
      </div>

      {/* Saldo Terkini */}
      <div 
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
            <h3 className="font-semibold mb-sm" style={{ opacity: 0.9 }}>Total Dana di Bendahara</h3>
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
              Rincian Metode Penerimaan
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

      <h3 className="font-bold mb-md">Riwayat Pengeluaran</h3>

      {/* Pengeluaran List */}
      <div className="stagger">
        {sortedPengeluaran.length === 0 ? (
          <div className="empty-state">
            <Minus size={48} />
            <h3>Belum ada pengeluaran</h3>
          </div>
        ) : (
          sortedPengeluaran.map(pg => {
            const met = metodeDonasi.find(m => m.id === pg.sumberDanaId);
            const pos = posPengeluaran.find(p => p.id === pg.posPengeluaranId);
            return (
              <div key={pg.id} className="list-item">
                <div className="list-item-avatar" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  <Minus size={20} />
                </div>
                <div className="list-item-content">
                  <div className="list-item-title">{pos?.nama || '-'}</div>
                  <div className="list-item-subtitle">{met?.nama} · {formatTanggalShort(pg.tanggal)}</div>
                  {pg.keterangan && <div className="list-item-subtitle">{pg.keterangan}</div>}
                </div>
                <div className="list-item-trailing">
                  <div className="font-bold" style={{ color: 'var(--danger)' }}>-{formatRupiah(pg.nominal)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Pengeluaran</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tanggal *</label>
                  <input type="date" className="form-input" value={form.tanggal} onChange={(e) => setForm(prev => ({ ...prev, tanggal: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Sumber Dana *</label>
                  <select className="form-select" value={form.sumberDanaId} onChange={(e) => setForm(prev => ({ ...prev, sumberDanaId: e.target.value }))} required>
                    <option value="">-- Pilih Sumber Dana --</option>
                    {rekap.map(m => (
                      <option key={m.id} value={m.id}>{m.nama} (Saldo: {formatRupiah(m.saldoTersedia)})</option>
                    ))}
                  </select>
                  {form.sumberDanaId && (
                    <span className="form-hint">Saldo tersedia: {formatRupiah(rekap.find(r => r.id === form.sumberDanaId)?.saldoTersedia || 0)}</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Pos Pengeluaran *</label>
                  <select className="form-select" value={form.posPengeluaranId} onChange={(e) => setForm(prev => ({ ...prev, posPengeluaranId: e.target.value }))} required>
                    <option value="">-- Pilih Pos --</option>
                    {posPengeluaran.filter(p => p.aktif).map(p => (
                      <option key={p.id} value={p.id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nominal (Rp) *</label>
                  <input type="number" className="form-input" placeholder="0" value={form.nominal} onChange={(e) => setForm(prev => ({ ...prev, nominal: e.target.value }))} min="1000" required />
                  {form.sumberDanaId && parseInt(form.nominal) > (rekap.find(r => r.id === form.sumberDanaId)?.saldoTersedia || 0) && (
                    <span className="form-error">Nominal melebihi saldo!</span>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Keterangan</label>
                  <textarea className="form-textarea" placeholder="Keterangan pengeluaran..." value={form.keterangan} onChange={(e) => setForm(prev => ({ ...prev, keterangan: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  <Wallet size={16} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      {!readOnly && (
        <button className="fab" onClick={() => setShowForm(true)} style={{ display: 'none' }}>
          <Plus size={24} />
        </button>
      )}
      <style jsx>{`
        @media (max-width: 1024px) {
          .fab { display: flex !important; }
          .page-header-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}
