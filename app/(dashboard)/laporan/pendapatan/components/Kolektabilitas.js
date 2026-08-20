'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { formatRupiah, formatTanggalShort, getStatusBadge } from '@/lib/mock';
import { hasPermission } from '@/lib/rbac';
import { Calendar, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export function Kolektabilitas() {
  const { user } = useAuth();
  const { donasi, donatur, users } = useData();
  const now = new Date();
  const [filterBulan, setFilterBulan] = useState(now.getMonth().toString());
  const [filterTahun, setFilterTahun] = useState(now.getFullYear().toString());

  if (!hasPermission(user, 'laporan.kolektabilitas')) {
    return <div className="p-xl text-center">Akses ditolak. Anda tidak memiliki izin.</div>;
  }

  const isPetugas = user?.role === 'petugas';

  const bulanOptions = [
    { value: '0', label: 'Januari' }, { value: '1', label: 'Februari' },
    { value: '2', label: 'Maret' }, { value: '3', label: 'April' },
    { value: '4', label: 'Mei' }, { value: '5', label: 'Juni' },
    { value: '6', label: 'Juli' }, { value: '7', label: 'Agustus' },
    { value: '8', label: 'September' }, { value: '9', label: 'Oktober' },
    { value: '10', label: 'November' }, { value: '11', label: 'Desember' },
  ];

  const availableYears = useMemo(() => {
    const years = new Set(donasi.map(d => new Date(d.tanggal).getFullYear()));
    years.add(now.getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [donasi]);

  const kolektabilitas = useMemo(() => {
    // Get relevant donatur list
    let donaturList = donatur;
    if (isPetugas) {
      donaturList = donatur.filter(d => d.createdBy === user?.id);
    }

    const bulan = parseInt(filterBulan);
    const tahun = parseInt(filterTahun);

    return donaturList.map(d => {
      // Find donations from this donatur in the selected period
      const donasiDonatur = donasi.filter(dn => {
        const date = new Date(dn.tanggal);
        return dn.donaturId === d.id 
          && date.getMonth() === bulan 
          && date.getFullYear() === tahun;
      });

      const totalDonasi = donasiDonatur.reduce((sum, dn) => sum + dn.nominal, 0);
      const sudahDonasi = donasiDonatur.length > 0;
      const petugas = users.find(u => u.id === d.createdBy);
      const lastDonasi = donasiDonatur.length > 0 
        ? donasiDonatur.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0]
        : null;

      return {
        ...d,
        sudahDonasi,
        totalDonasi,
        jumlahDonasi: donasiDonatur.length,
        petugasNama: petugas?.name || '-',
        lastDonasiTanggal: lastDonasi?.tanggal || null,
      };
    }).sort((a, b) => {
      // Sort: belum donasi first, then by name
      if (a.sudahDonasi !== b.sudahDonasi) return a.sudahDonasi ? 1 : -1;
      return a.nama.localeCompare(b.nama);
    });
  }, [donatur, donasi, users, isPetugas, user, filterBulan, filterTahun]);

  const sudahCount = kolektabilitas.filter(d => d.sudahDonasi).length;
  const belumCount = kolektabilitas.filter(d => !d.sudahDonasi).length;
  const totalAmount = kolektabilitas.reduce((sum, d) => sum + d.totalDonasi, 0);
  const persen = kolektabilitas.length > 0 ? Math.round((sudahCount / kolektabilitas.length) * 100) : 0;

  return (
    <div className="animate-fade-in-up pb-xl">
      {/* Filters */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center gap-sm mb-md">
          <Calendar size={16} color="var(--text-secondary)" />
          <span className="text-sm font-semibold text-secondary">Periode</span>
        </div>
        <div className="form-row">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-select" value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)}>
              {bulanOptions.map(b => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select className="form-select" value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-md mb-lg" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="text-sm text-secondary mb-xs">Total Donatur</div>
          <div className="text-2xl font-bold">{kolektabilitas.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div className="text-sm text-secondary mb-xs">Sudah Donasi</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--success)' }}>{sudahCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="text-sm text-secondary mb-xs">Belum Donasi</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--danger)' }}>{belumCount}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="text-sm text-secondary mb-xs">Kolektabilitas</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--info)' }}>{persen}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card mb-lg" style={{ padding: 'var(--space-md)' }}>
        <div className="flex items-center justify-between mb-sm">
          <span className="text-sm font-semibold">Tingkat Kolektabilitas</span>
          <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{persen}%</span>
        </div>
        <div style={{ width: '100%', height: '10px', borderRadius: '5px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <div style={{ width: `${persen}%`, height: '100%', borderRadius: '5px', background: persen >= 75 ? 'var(--success)' : persen >= 50 ? 'var(--warning)' : 'var(--danger)', transition: 'width 0.5s ease' }} />
        </div>
        <div className="text-sm text-tertiary mt-sm">Total terkumpul: {formatRupiah(totalAmount)}</div>
      </div>

      {/* Table */}
      <div className="table-container table-mobile">
        <table className="table">
          <thead>
            <tr>
              <th>No</th>
              <th>Nama Donatur</th>
              <th>Petugas</th>
              <th>Status</th>
              <th>Jumlah Donasi</th>
              <th className="text-right">Total Nominal</th>
              <th>Terakhir Donasi</th>
            </tr>
          </thead>
          <tbody>
            {kolektabilitas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-secondary" style={{ padding: '32px' }}>
                  Tidak ada data donatur.
                </td>
              </tr>
            ) : (
              kolektabilitas.map((d, idx) => (
                <tr key={d.id}>
                  <td data-label="No">{idx + 1}</td>
                  <td data-label="Donatur" className="font-semibold">{d.nama}</td>
                  <td data-label="Petugas">{d.petugasNama}</td>
                  <td data-label="Status">
                    {d.sudahDonasi ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} /> Sudah
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={12} /> Belum
                      </span>
                    )}
                  </td>
                  <td data-label="Jumlah">{d.jumlahDonasi}x</td>
                  <td data-label="Nominal" className="text-right font-semibold text-primary-color">
                    {d.totalDonasi > 0 ? formatRupiah(d.totalDonasi) : '-'}
                  </td>
                  <td data-label="Terakhir">{d.lastDonasiTanggal ? formatTanggalShort(d.lastDonasiTanggal) : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
