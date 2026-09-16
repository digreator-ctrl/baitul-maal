'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const initialPesanWa = `Assalamu'alaikum Bpk/Ibu {nama},\n\nTerima kasih atas donasi sebesar {nominal} untuk kategori {kategori} yang telah kami terima pada tanggal {tanggal} melalui {metode}.\n\nSemoga menjadi amal jariyah yang terus mengalir pahalanya. Aamiin.`;

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [donatur, setDonatur] = useState([]);
  const [donasi, setDonasi] = useState([]);
  const [setoran, setSetoran] = useState([]);
  const [pengeluaran, setPengeluaran] = useState([]);
  const [kategoriDonasi, setKategoriDonasi] = useState([]);
  const [metodeDonasi, setMetodeDonasi] = useState([]);
  const [posPengeluaran, setPosPengeluaran] = useState([]);
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [pesanWa, setPesanWa] = useState(initialPesanWa);
  const [toast, setToast] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ---- Donatur CRUD ----
  const fetchDonatur = useCallback(async () => {
    try {
      const res = await fetch('/api/donatur');
      if (res.ok) {
        const data = await res.json();
        setDonatur(data);
      }
    } catch (error) {
      console.error('Failed to fetch donatur', error);
    }
  }, []);

  const addDonatur = useCallback(async (data) => {
    try {
      const res = await fetch('/api/donatur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newDonatur = await res.json();
        setDonatur(prev => [newDonatur, ...prev]);
        showToast('Donatur berhasil ditambahkan');
        return newDonatur;
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menambah donatur', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  const updateDonatur = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/donatur/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setDonatur(prev => prev.map(d => d.id === id ? updated : d));
        showToast('Data donatur berhasil diperbarui');
      } else {
        showToast('Gagal memperbarui donatur', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  const deleteDonatur = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/donatur/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDonatur(prev => prev.filter(d => d.id !== id));
        showToast('Donatur berhasil dihapus', 'success');
      } else {
        const err = await res.json().catch(() => null);
        showToast(err?.error || 'Gagal menghapus donatur', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  // ---- Donasi CRUD ----
  const fetchDonasi = useCallback(async () => {
    try {
      const res = await fetch('/api/transaksi/donasi');
      if (res.ok) setDonasi(await res.json());
    } catch (error) { console.error('Failed to fetch donasi', error); }
  }, []);

  const addDonasi = useCallback(async (data) => {
    try {
      const res = await fetch('/api/transaksi/donasi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const newDonasi = await res.json();
        setDonasi(prev => [newDonasi, ...prev]);
        showToast('Donasi berhasil dicatat');
        return newDonasi;
      } else showToast('Gagal mencatat donasi', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const updateDonasi = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/transaksi/donasi/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setDonasi(prev => prev.map(d => d.id === id ? updated : d));
        showToast('Data donasi berhasil diperbarui');
      } else showToast('Gagal memperbarui donasi', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const deleteDonasi = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/transaksi/donasi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDonasi(prev => prev.filter(d => d.id !== id));
        showToast('Donasi berhasil dihapus', 'danger');
      } else showToast('Gagal menghapus donasi', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  // ---- Setoran (Sistem Ledger) ----
  const fetchSetoran = useCallback(async () => {
    try {
      const res = await fetch('/api/transaksi/setoran');
      if (res.ok) setSetoran(await res.json());
    } catch (error) { console.error('Failed to fetch setoran', error); }
  }, []);

  const createSetoran = useCallback(async (petugasId, tanggal, metodeDonasiId, nominal, keterangan, donasiIds = []) => {
    try {
      const payload = { tanggal, metodeDonasiId, totalNominal: nominal, keterangan, donasiIds };
      const res = await fetch('/api/transaksi/setoran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newSetoran = await res.json();
        setSetoran(prev => [newSetoran, ...prev]);
        showToast('Setoran berhasil diajukan');
        if (fetchDonasi) fetchDonasi(); // refresh donasi statuses
        return newSetoran;
      } else showToast('Gagal mengajukan setoran', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast, fetchDonasi]);

  // ---- Verifikasi ----
  const verifikasiSetoran = useCallback(async (setoranId, bendaharaId, approved, catatan = '') => {
    try {
      const status = approved ? 'terverifikasi' : 'ditolak';
      const res = await fetch(`/api/transaksi/setoran/${setoranId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, catatan }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSetoran(prev => prev.map(s => s.id === setoranId ? updated : s));
        showToast(approved ? 'Setoran diverifikasi' : 'Setoran ditolak', approved ? 'success' : 'danger');
        if (fetchDonasi) fetchDonasi();
      } else showToast('Gagal memverifikasi setoran', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast, fetchDonasi]);

  // ---- Pengeluaran ----
  const fetchPengeluaran = useCallback(async () => {
    try {
      const res = await fetch('/api/transaksi/pengeluaran');
      if (res.ok) setPengeluaran(await res.json());
    } catch (error) { console.error('Failed to fetch pengeluaran', error); }
  }, []);

  const addPengeluaran = useCallback(async (data) => {
    try {
      const res = await fetch('/api/transaksi/pengeluaran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const newPengeluaran = await res.json();
        setPengeluaran(prev => [newPengeluaran, ...prev]);
        showToast('Pengeluaran berhasil dicatat');
        return newPengeluaran;
      } else showToast('Gagal mencatat pengeluaran', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  // ---- Master Data CRUD ----
  const fetchKategoriDonasi = useCallback(async () => {
    try {
      const res = await fetch('/api/master/kategori-donasi');
      if (res.ok) setKategoriDonasi(await res.json());
    } catch (error) { console.error('Failed to fetch kategori donasi', error); }
  }, []);

  const addKategoriDonasi = useCallback(async (data) => {
    try {
      const res = await fetch('/api/master/kategori-donasi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const newItem = await res.json();
        setKategoriDonasi(prev => [...prev, newItem]);
        showToast('Kategori donasi ditambahkan');
      } else showToast('Gagal menambah kategori', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const updateKategoriDonasi = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/master/kategori-donasi/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setKategoriDonasi(prev => prev.map(k => k.id === id ? updated : k));
        showToast('Kategori donasi diperbarui');
      } else showToast('Gagal memperbarui kategori', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const deleteKategoriDonasi = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/master/kategori-donasi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKategoriDonasi(prev => prev.filter(k => k.id !== id));
        showToast('Kategori donasi dihapus', 'danger');
      } else showToast('Gagal menghapus kategori', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const fetchMetodeDonasi = useCallback(async () => {
    try {
      const res = await fetch('/api/master/metode-donasi');
      if (res.ok) setMetodeDonasi(await res.json());
    } catch (error) { console.error('Failed to fetch metode donasi', error); }
  }, []);

  const addMetodeDonasi = useCallback(async (data) => {
    try {
      const res = await fetch('/api/master/metode-donasi', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const newItem = await res.json();
        setMetodeDonasi(prev => [...prev, newItem]);
        showToast('Metode donasi ditambahkan');
      } else showToast('Gagal menambah metode', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const updateMetodeDonasi = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/master/metode-donasi/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setMetodeDonasi(prev => prev.map(m => m.id === id ? updated : m));
        showToast('Metode donasi diperbarui');
      } else showToast('Gagal memperbarui metode', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const deleteMetodeDonasi = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/master/metode-donasi/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMetodeDonasi(prev => prev.filter(m => m.id !== id));
        showToast('Metode donasi dihapus', 'danger');
      } else showToast('Gagal menghapus metode', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const fetchPosPengeluaran = useCallback(async () => {
    try {
      const res = await fetch('/api/master/pos-pengeluaran');
      if (res.ok) setPosPengeluaran(await res.json());
    } catch (error) { console.error('Failed to fetch pos pengeluaran', error); }
  }, []);

  const addPosPengeluaran = useCallback(async (data) => {
    try {
      const res = await fetch('/api/master/pos-pengeluaran', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const newItem = await res.json();
        setPosPengeluaran(prev => [...prev, newItem]);
        showToast('Pos pengeluaran ditambahkan');
      } else showToast('Gagal menambah pos', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const updatePosPengeluaran = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/master/pos-pengeluaran/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosPengeluaran(prev => prev.map(p => p.id === id ? updated : p));
        showToast('Pos pengeluaran diperbarui');
      } else showToast('Gagal memperbarui pos', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const deletePosPengeluaran = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/master/pos-pengeluaran/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPosPengeluaran(prev => prev.filter(p => p.id !== id));
        showToast('Pos pengeluaran dihapus', 'danger');
      } else showToast('Gagal menghapus pos', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  // ---- Roles ----
  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch('/api/master/role');
      if (res.ok) setRoles(await res.json());
    } catch (error) { console.error('Failed to fetch roles', error); }
  }, []);

  const addRole = useCallback(async (data) => {
    try {
      const payload = { ...data, id: data.id || data.name.toLowerCase().replace(/\s+/g, '-') };
      const res = await fetch('/api/master/role', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (res.ok) {
        const newRole = await res.json();
        setRoles(prev => [...prev, newRole]);
        showToast('Role berhasil ditambahkan');
      } else showToast('Gagal menambah role', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const updateRole = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/master/role/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setRoles(prev => prev.map(r => r.id === id ? updated : r));
        showToast('Role berhasil diperbarui');
      } else showToast('Gagal memperbarui role', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  const deleteRole = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/master/role/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRoles(prev => prev.filter(r => r.id !== id));
        showToast('Role berhasil dihapus', 'danger');
      } else showToast('Gagal menghapus role', 'danger');
    } catch (error) { showToast('Terjadi kesalahan', 'danger'); }
  }, [showToast]);

  // ---- Users ----
  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  }, []);

  const addUser = useCallback(async (data) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers(prev => [newUser, ...prev]);
        showToast('Pengguna berhasil ditambahkan');
      } else {
        const err = await res.json();
        showToast(err.error || 'Gagal menambah pengguna', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  const updateUser = useCallback(async (id, data) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? updated : u));
        showToast('Pengguna berhasil diperbarui');
      } else {
        showToast('Gagal memperbarui pengguna', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  const deleteUser = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast('Pengguna berhasil dihapus', 'danger');
      } else {
        showToast('Gagal menghapus pengguna', 'danger');
      }
    } catch (error) {
      showToast('Terjadi kesalahan', 'danger');
    }
  }, [showToast]);

  // ---- Computed Saldo ----
  const getSaldoPerMetode = useCallback(() => {
    const saldo = {};
    metodeDonasi.forEach(m => { saldo[m.id] = 0; });

    // Add verified donations
    donasi
      .filter(d => d.status === 'terverifikasi')
      .forEach(d => {
        if (saldo[d.metodeId] !== undefined) {
          saldo[d.metodeId] += d.nominal;
        }
      });

    // Subtract expenses
    pengeluaran.forEach(p => {
      if (saldo[p.metodeId] !== undefined) {
        saldo[p.metodeId] -= p.nominal;
      }
    });

    // Prevent negative saldo
    Object.keys(saldo).forEach(k => {
      saldo[k] = Math.max(0, saldo[k]);
    });

    return saldo;
  }, [donasi, pengeluaran, metodeDonasi]);

  const value = {
    // Data
    donatur, donasi, setoran, pengeluaran,
    kategoriDonasi, metodeDonasi, posPengeluaran, roles, users,
    toast,
    isLoadingData,
    
    // Donatur
    fetchDonatur, addDonatur, updateDonatur, deleteDonatur,
    
    // Donasi
    fetchDonasi, addDonasi, updateDonasi, deleteDonasi,
    
    // Setoran
    fetchSetoran, createSetoran, verifikasiSetoran,
    
    // Pengeluaran
    fetchPengeluaran, addPengeluaran,
    
    // Master Data
    fetchKategoriDonasi, addKategoriDonasi, updateKategoriDonasi, deleteKategoriDonasi,
    fetchMetodeDonasi, addMetodeDonasi, updateMetodeDonasi, deleteMetodeDonasi,
    fetchPosPengeluaran, addPosPengeluaran, updatePosPengeluaran, deletePosPengeluaran,
    roles,
    users,
    pesanWa,
    setPesanWa,
    
    // Roles
    fetchRoles, addRole, updateRole, deleteRole,
    
    // Users
    fetchUsers, addUser, updateUser, deleteUser,
    
    // Computed
    getSaldoPerMetode,
    showToast,
  };

  const { status } = useSession();

  // Fetch all data when authenticated or on mount
  useEffect(() => {
    let isMounted = true;
    const loadAllData = async () => {
      if (status === 'authenticated') {
        setIsLoadingData(true);
        await Promise.all([
          fetchDonatur(),
          fetchDonasi(),
          fetchSetoran(),
          fetchPengeluaran(),
          fetchKategoriDonasi(),
          fetchMetodeDonasi(),
          fetchPosPengeluaran(),
          fetchRoles(),
          fetchUsers()
        ]);
        if (isMounted) {
          setIsLoadingData(false);
        }
      }
    };
    loadAllData();
    return () => { isMounted = false; };
  }, [status, fetchDonatur, fetchDonasi, fetchSetoran, fetchPengeluaran, fetchKategoriDonasi, fetchMetodeDonasi, fetchPosPengeluaran, fetchRoles, fetchUsers]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
}
