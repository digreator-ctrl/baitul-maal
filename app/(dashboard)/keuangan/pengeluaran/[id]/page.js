'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort } from '@/lib/utils';
import { ArrowLeft, Calendar, FileText, Wallet, FolderOpen, Info, User, Clock, Edit3 } from 'lucide-react';

export default function DetailPengeluaranPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { pengeluaran, metodeDonasi, posPengeluaran, users } = useData();

  const dataPengeluaran = pengeluaran.find(p => p.id === id);

  if (!dataPengeluaran) {
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

  const metode = metodeDonasi.find(m => m.id === dataPengeluaran.sumberDanaId);
  const pos = posPengeluaran.find(p => p.id === dataPengeluaran.posPengeluaranId);
  const creator = users?.find(u => u.id === dataPengeluaran.createdBy);
  const updater = dataPengeluaran.updatedBy ? users?.find(u => u.id === dataPengeluaran.updatedBy) : null;

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-ghost btn-sm mb-md" onClick={() => router.back()}>
          <ArrowLeft size={16} /> Kembali
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Detail Pengeluaran</h1>
            <p style={{ marginTop: '8px' }}>Rincian data pengeluaran dana donasi.</p>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 0', borderBottom: '1px dashed var(--border)' }}>
          <h2 className="font-bold text-danger" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {formatRupiah(dataPengeluaran.nominal)}
          </h2>
          <p className="text-secondary font-medium" style={{ fontSize: '1.1rem' }}>{pos?.nama || 'Pengeluaran'}</p>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informasi Pengeluaran</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Calendar size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Tanggal Pengeluaran</div>
                <div className="font-medium">{new Date(dataPengeluaran.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <FolderOpen size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Pos Pengeluaran</div>
                <div className="font-medium">{pos?.nama || '-'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Wallet size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Sumber Dana</div>
                <div className="font-medium">{metode?.nama || '-'}</div>
              </div>
            </div>

            {dataPengeluaran.keterangan && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <FileText size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Keterangan</div>
                  <div className="font-medium">{dataPengeluaran.keterangan}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '0 24px 24px 24px' }}>
          <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Log Sistem</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <User size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Dicatat Oleh</div>
                <div className="font-medium">{creator?.name || '-'}</div>
              </div>
            </div>

            {dataPengeluaran.updatedAt && (
              <>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Clock size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                  <div>
                    <div className="text-sm text-secondary">Terakhir Diubah</div>
                    <div className="font-medium">{new Date(dataPengeluaran.updatedAt).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(/\//g, '-')}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Edit3 size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                  <div>
                    <div className="text-sm text-secondary">Diubah Oleh</div>
                    <div className="font-medium">{updater?.name || '-'}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
