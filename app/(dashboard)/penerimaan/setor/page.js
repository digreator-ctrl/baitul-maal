'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/mock';
import { ArrowLeft, Send, HandCoins, CheckSquare } from 'lucide-react';

export default function SetorPage() {
  const { user } = useAuth();
  const { donasi, donatur, kategoriDonasi, metodeDonasi, createSetoran } = useData();
  const router = useRouter();
  const [selected, setSelected] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);

  const belumDisetor = useMemo(() => {
    let list = donasi.filter(d => d.status === 'belum_disetor');
    if (user?.role === 'petugas') {
      list = list.filter(d => d.petugasId === user.id);
    }
    return list.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  }, [donasi, user]);

  const totalSelected = useMemo(() => {
    return belumDisetor.filter(d => selected.includes(d.id)).reduce((sum, d) => sum + d.nominal, 0);
  }, [belumDisetor, selected]);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === belumDisetor.length) {
      setSelected([]);
    } else {
      setSelected(belumDisetor.map(d => d.id));
    }
  };

  const handleSetor = () => {
    if (selected.length === 0) return;
    createSetoran(user?.id, selected);
    setSelected([]);
    setShowConfirm(false);
    router.push('/penerimaan/riwayat');
  };

  return (
    <div className="animate-fade-in-up">
      <div className="page-header">
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <h1>Setor ke Bendahara</h1>
        <p>Pilih donasi yang akan disetorkan</p>
      </div>

      {/* Select All */}
      {belumDisetor.length > 0 && (
        <div className="flex items-center justify-between mb-md">
          <label className="checkbox-wrapper" onClick={selectAll}>
            <input type="checkbox" checked={selected.length === belumDisetor.length && belumDisetor.length > 0} readOnly />
            <span className="text-sm">Pilih Semua ({belumDisetor.length})</span>
          </label>
          {selected.length > 0 && (
            <span className="badge badge-primary">{selected.length} dipilih</span>
          )}
        </div>
      )}

      {/* List */}
      {belumDisetor.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>Semua donasi sudah disetor</h3>
          <p>Tidak ada donasi yang menunggu untuk disetorkan.</p>
        </div>
      ) : (
        <div className="stagger">
          {belumDisetor.map(dn => {
            const don = donatur.find(x => x.id === dn.donaturId);
            const kat = kategoriDonasi.find(k => k.id === dn.kategoriDonasiId);
            const met = metodeDonasi.find(m => m.id === dn.metodeDonasiId);
            const isSelected = selected.includes(dn.id);
            return (
              <div
                key={dn.id}
                className="list-item"
                onClick={() => toggleSelect(dn.id)}
                style={{
                  borderColor: isSelected ? 'var(--primary)' : undefined,
                  background: isSelected ? 'var(--primary-bg)' : undefined,
                }}
              >
                <input type="checkbox" checked={isSelected} readOnly style={{ width: 20, height: 20, accentColor: 'var(--primary)', cursor: 'pointer', flexShrink: 0 }} />
                <div className="list-item-content">
                  <div className="list-item-title">{don?.nama || '-'}</div>
                  <div className="list-item-subtitle">{kat?.nama} · {met?.nama}</div>
                  <div className="list-item-subtitle">{formatTanggalShort(dn.tanggal)}</div>
                </div>
                <div className="list-item-trailing">
                  <div className="list-item-value">{formatRupiah(dn.nominal)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Bar */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 'var(--space-md)',
          left: 'var(--space-md)',
          right: 'var(--space-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--primary)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 80,
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        }}>
          <div>
            <div className="text-sm text-secondary">{selected.length} donasi dipilih</div>
            <div className="font-bold text-primary-color">{formatRupiah(totalSelected)}</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowConfirm(true)}>
            <Send size={16} /> Setor
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Konfirmasi Setoran</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Anda akan menyetor <strong>{selected.length}</strong> donasi dengan total:</p>
              <div className="saldo-card mt-md" style={{ padding: 'var(--space-lg)', textAlign: 'center' }}>
                <div className="saldo-label">Total Setoran</div>
                <div className="saldo-amount">{formatRupiah(totalSelected)}</div>
              </div>
              <p className="text-sm text-secondary mt-md">Setoran akan dikirim ke bendahara untuk diverifikasi.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSetor}>
                <Send size={16} /> Kirim Setoran
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (min-width: 1024px) {
          div[style*="bottom: var(--space-md)"] {
            left: calc(var(--sidebar-width) + var(--space-xl)) !important;
            right: var(--space-xl) !important;
            bottom: var(--space-lg) !important;
          }
        }
      `}</style>
    </div>
  );
}
