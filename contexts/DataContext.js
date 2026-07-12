'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import {
  mockDonatur as initialDonatur,
  mockDonasi as initialDonasi,
  mockSetoran as initialSetoran,
  mockPengeluaran as initialPengeluaran,
  mockKategoriDonasi as initialKategoriDonasi,
  mockMetodeDonasi as initialMetodeDonasi,
  mockPosPengeluaran as initialPosPengeluaran,
  mockRoles as initialRoles,
  mockUsers as initialUsers,
  mockPesanWa as initialPesanWa,
  generateId,
} from '@/lib/mock';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [donatur, setDonatur] = useState(initialDonatur);
  const [donasi, setDonasi] = useState(initialDonasi);
  const [setoran, setSetoran] = useState(initialSetoran);
  const [pengeluaran, setPengeluaran] = useState(initialPengeluaran);
  const [kategoriDonasi, setKategoriDonasi] = useState(initialKategoriDonasi);
  const [metodeDonasi, setMetodeDonasi] = useState(initialMetodeDonasi);
  const [posPengeluaran, setPosPengeluaran] = useState(initialPosPengeluaran);
  const [roles, setRoles] = useState(initialRoles);
  const [users, setUsers] = useState(initialUsers);
  const [pesanWa, setPesanWa] = useState(initialPesanWa);
  const [toast, setToast] = useState(null);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ---- Donatur CRUD ----
  const addDonatur = useCallback((data) => {
    const newDonatur = { ...data, id: generateId('d'), createdAt: new Date().toISOString().split('T')[0] };
    setDonatur(prev => [newDonatur, ...prev]);
    showToast('Donatur berhasil ditambahkan');
    return newDonatur;
  }, [showToast]);

  const updateDonatur = useCallback((id, data) => {
    setDonatur(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    showToast('Data donatur berhasil diperbarui');
  }, [showToast]);

  const deleteDonatur = useCallback((id) => {
    setDonatur(prev => prev.filter(d => d.id !== id));
    showToast('Donatur berhasil dihapus', 'danger');
  }, [showToast]);

  // ---- Donasi CRUD ----
  const addDonasi = useCallback((data) => {
    const newDonasi = { ...data, id: generateId('dn'), status: 'belum_disetor', setoranId: null };
    setDonasi(prev => [newDonasi, ...prev]);
    showToast('Donasi berhasil dicatat');
    return newDonasi;
  }, [showToast]);

  const updateDonasi = useCallback((id, data) => {
    setDonasi(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
    showToast('Data donasi berhasil diperbarui');
  }, [showToast]);

  const deleteDonasi = useCallback((id) => {
    setDonasi(prev => prev.filter(d => d.id !== id));
    showToast('Donasi berhasil dihapus', 'danger');
  }, [showToast]);

  // ---- Setoran ----
  const createSetoran = useCallback((petugasId, donasiIds) => {
    const selected = donasi.filter(d => donasiIds.includes(d.id));
    const totalNominal = selected.reduce((sum, d) => sum + d.nominal, 0);
    const newSetoran = {
      id: generateId('s'),
      petugasId,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'menunggu_verifikasi',
      donasiIds,
      totalNominal,
      verifikasiOleh: null,
      tanggalVerifikasi: null,
      catatan: '',
    };
    setSetoran(prev => [newSetoran, ...prev]);
    setDonasi(prev => prev.map(d =>
      donasiIds.includes(d.id) ? { ...d, status: 'menunggu_verifikasi', setoranId: newSetoran.id } : d
    ));
    showToast('Setoran berhasil dibuat');
    return newSetoran;
  }, [donasi, showToast]);

  // ---- Verifikasi ----
  const verifikasiSetoran = useCallback((setoranId, bendaharaId, approved, catatan = '') => {
    const newStatus = approved ? 'terverifikasi' : 'ditolak';
    setSetoran(prev => prev.map(s =>
      s.id === setoranId
        ? { ...s, status: newStatus, verifikasiOleh: bendaharaId, tanggalVerifikasi: new Date().toISOString().split('T')[0], catatan }
        : s
    ));
    // Update donasi statuses too
    const targetSetoran = setoran.find(s => s.id === setoranId);
    if (targetSetoran) {
      setDonasi(prev => prev.map(d =>
        targetSetoran.donasiIds.includes(d.id) ? { ...d, status: newStatus } : d
      ));
    }
    showToast(approved ? 'Setoran berhasil diverifikasi' : 'Setoran ditolak', approved ? 'success' : 'danger');
  }, [setoran, showToast]);

  // ---- Pengeluaran ----
  const addPengeluaran = useCallback((data) => {
    const newPengeluaran = { ...data, id: generateId('pg') };
    setPengeluaran(prev => [newPengeluaran, ...prev]);
    showToast('Pengeluaran berhasil dicatat');
    return newPengeluaran;
  }, [showToast]);

  // ---- Master Data CRUD ----
  const addKategoriDonasi = useCallback((data) => {
    const newItem = { ...data, id: generateId('kd'), aktif: true };
    setKategoriDonasi(prev => [...prev, newItem]);
    showToast('Kategori donasi berhasil ditambahkan');
  }, [showToast]);

  const updateKategoriDonasi = useCallback((id, data) => {
    setKategoriDonasi(prev => prev.map(k => k.id === id ? { ...k, ...data } : k));
    showToast('Kategori donasi berhasil diperbarui');
  }, [showToast]);

  const deleteKategoriDonasi = useCallback((id) => {
    setKategoriDonasi(prev => prev.filter(k => k.id !== id));
    showToast('Kategori donasi berhasil dihapus', 'danger');
  }, [showToast]);

  const addMetodeDonasi = useCallback((data) => {
    const newItem = { ...data, id: generateId('md'), aktif: true };
    setMetodeDonasi(prev => [...prev, newItem]);
    showToast('Metode donasi berhasil ditambahkan');
  }, [showToast]);

  const updateMetodeDonasi = useCallback((id, data) => {
    setMetodeDonasi(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    showToast('Metode donasi berhasil diperbarui');
  }, [showToast]);

  const deleteMetodeDonasi = useCallback((id) => {
    setMetodeDonasi(prev => prev.filter(m => m.id !== id));
    showToast('Metode donasi berhasil dihapus', 'danger');
  }, [showToast]);

  const addPosPengeluaran = useCallback((data) => {
    const newItem = { ...data, id: generateId('pp'), aktif: true };
    setPosPengeluaran(prev => [...prev, newItem]);
    showToast('Pos pengeluaran berhasil ditambahkan');
  }, [showToast]);

  const updatePosPengeluaran = useCallback((id, data) => {
    setPosPengeluaran(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    showToast('Pos pengeluaran berhasil diperbarui');
  }, [showToast]);

  const deletePosPengeluaran = useCallback((id) => {
    setPosPengeluaran(prev => prev.filter(p => p.id !== id));
    showToast('Pos pengeluaran berhasil dihapus', 'danger');
  }, [showToast]);

  // ---- Roles ----
  const addRole = useCallback((data) => {
    const newRole = { ...data, id: data.id || generateId('r') };
    setRoles(prev => [...prev, newRole]);
    showToast('Role berhasil ditambahkan');
  }, [showToast]);

  const updateRole = useCallback((id, data) => {
    setRoles(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    showToast('Role berhasil diperbarui');
  }, [showToast]);

  const deleteRole = useCallback((id) => {
    setRoles(prev => prev.filter(r => r.id !== id));
    showToast('Role berhasil dihapus', 'danger');
  }, [showToast]);

  // ---- Users ----
  const addUser = useCallback((data) => {
    const newUser = { ...data, id: generateId('u'), avatar: data.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() };
    setUsers(prev => [...prev, newUser]);
    showToast('Pengguna berhasil ditambahkan');
  }, [showToast]);

  const updateUser = useCallback((id, data) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    showToast('Pengguna berhasil diperbarui');
  }, [showToast]);

  const deleteUser = useCallback((id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Pengguna berhasil dihapus', 'danger');
  }, [showToast]);

  // ---- Computed Saldo ----
  const getSaldoPerMetode = useCallback(() => {
    const saldo = {};
    metodeDonasi.forEach(m => { saldo[m.id] = 0; });

    // Add verified donations
    donasi
      .filter(d => d.status === 'terverifikasi')
      .forEach(d => {
        if (saldo[d.metodeDonasiId] !== undefined) {
          saldo[d.metodeDonasiId] += d.nominal;
        }
      });

    // Subtract expenses
    pengeluaran.forEach(p => {
      if (saldo[p.sumberDanaId] !== undefined) {
        saldo[p.sumberDanaId] -= p.nominal;
      }
    });

    return saldo;
  }, [donasi, pengeluaran, metodeDonasi]);

  const value = {
    // Data
    donatur, donasi, setoran, pengeluaran,
    kategoriDonasi, metodeDonasi, posPengeluaran, roles, users,
    toast,
    
    // Donatur
    addDonatur, updateDonatur, deleteDonatur,
    
    // Donasi
    addDonasi, updateDonasi, deleteDonasi,
    
    // Setoran
    createSetoran, verifikasiSetoran,
    
    // Pengeluaran
    addPengeluaran,
    
    // Master Data
    addKategoriDonasi, updateKategoriDonasi, deleteKategoriDonasi,
    addMetodeDonasi, updateMetodeDonasi, deleteMetodeDonasi,
    addPosPengeluaran, updatePosPengeluaran, deletePosPengeluaran,
    roles,
    users,
    pesanWa,
    setPesanWa,
    
    // Roles
    addRole, updateRole, deleteRole,
    
    // Users
    addUser, updateUser, deleteUser,
    
    // Computed
    getSaldoPerMetode,
    showToast,
  };

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
