'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { isReadOnly } from '@/lib/rbac';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, Plus, Minus, Wallet } from 'lucide-react';

export default function PengeluaranPage() {
  const { user } = useAuth();
  const { pengeluaran, metodeDonasi, posPengeluaran, addPengeluaran, getSaldoPerMetode } = useData();
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    sumberDanaId: '', posPengeluaranId: '', nominal: '', keterangan: '',
  });

  const readOnly = isReadOnly(user?.role);
  const saldo = useMemo(() => getSaldoPerMetode(), [getSaldoPerMetode]);

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

      {/* Saldo Overview */}
      <div className="grid gap-sm mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        {metodeDonasi.filter(m => m.aktif).map(m => {
          const s = saldo[m.id] || 0;
          return (
            <div key={m.id} className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="text-sm text-secondary">{m.nama}</div>
              <div className="font-bold" style={{ color: s > 0 ? 'var(--primary)' : 'var(--text-tertiary)' }}>
                {formatRupiah(s)}
              </div>
            </div>
          );
        })}
      </div>

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
                    {metodeDonasi.filter(m => m.aktif).map(m => (
                      <option key={m.id} value={m.id}>{m.nama} (Saldo: {formatRupiah(saldo[m.id] || 0)})</option>
                    ))}
                  </select>
                  {form.sumberDanaId && (
                    <span className="form-hint">Saldo tersedia: {formatRupiah(saldo[form.sumberDanaId] || 0)}</span>
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
                  {form.sumberDanaId && parseInt(form.nominal) > (saldo[form.sumberDanaId] || 0) && (
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
