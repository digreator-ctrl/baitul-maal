'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggal, getStatusBadge } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Clock, XCircle, HandCoins, Calendar, Wallet, FileText, User } from 'lucide-react';

export default function DetailSetoranPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { setoran, metodeDonasi, users } = useData();
  const [data, setData] = useState(null);

  useEffect(() => {
    const found = setoran.find(s => s.id === id);
    if (found) setData(found);
  }, [id, setoran]);

  if (!data) return <div className="p-lg text-center">Memuat data setoran...</div>;

  const met = metodeDonasi.find(m => m.id === data.metodeDonasiId);
  const petugas = users.find(u => u.id === data.petugasId);
  const bendahara = data.verifikasiOleh ? users.find(u => u.id === data.verifikasiOleh) : null;
  const status = getStatusBadge(data.status);

  return (
    <div className="animate-fade-in-up pb-xl">
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <button className="btn btn-ghost" onClick={() => router.back()} style={{ marginBottom: 'var(--space-sm)' }}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Detail Setoran</h1>
            <p style={{ marginTop: '8px' }}>Rincian pengajuan setoran dana donasi.</p>
          </div>
        </div>
      </div>

      <div className="card mb-lg" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '32px 0', borderBottom: '1px dashed var(--border)' }}>
          <span className={`badge badge-${status.variant}`} style={{ fontSize: '0.875rem', padding: '6px 12px', marginBottom: '16px' }}>
            {status.label}
          </span>
          <h2 className="font-bold text-primary" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
            {formatRupiah(data.totalNominal)}
          </h2>
          <p className="text-secondary font-medium" style={{ fontSize: '1.1rem' }}>{met?.nama || 'Metode Donasi'}</p>
        </div>

        <div style={{ padding: '24px' }}>
          <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informasi Pengajuan</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Calendar size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Tanggal Pengajuan</div>
                <div className="font-medium">{new Date(data.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <User size={18} className="text-secondary" style={{ marginTop: '2px' }} />
              <div>
                <div className="text-sm text-secondary">Diajukan Oleh (Petugas)</div>
                <div className="font-medium">{petugas?.name || '-'}</div>
              </div>
            </div>

            {data.keterangan && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <FileText size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Keterangan Petugas</div>
                  <div className="font-medium">{data.keterangan}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {(data.status === 'terverifikasi' || data.status === 'ditolak') && (
          <div style={{ padding: '0 24px 24px 24px' }}>
            <h3 className="font-semibold mb-md" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Informasi Verifikasi</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <User size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Diverifikasi Oleh</div>
                  <div className="font-medium">{bendahara?.name || '-'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <Calendar size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                <div>
                  <div className="text-sm text-secondary">Tanggal Verifikasi</div>
                  <div className="font-medium">{data.tanggalVerifikasi ? new Date(data.tanggalVerifikasi).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') : '-'}</div>
                </div>
              </div>

              {data.catatan && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <FileText size={18} className="text-secondary" style={{ marginTop: '2px' }} />
                  <div>
                    <div className="text-sm text-secondary">Catatan Bendahara</div>
                    <div className="font-medium">{data.catatan}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
