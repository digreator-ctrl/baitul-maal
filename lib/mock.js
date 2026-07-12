// ============================================
// MOCK DATA — Baitul Maal Ponpes Ar-Rosyad
// ============================================

// Roles
export const mockRoles = [
  {
    id: 'superadmin',
    name: 'Super Admin',
    permissions: [
      'dashboard.view', 'dashboard.kas', 'dashboard.kinerja',
      'donatur.view', 'donatur.create', 'donatur.edit', 'donatur.delete',
      'donasi.view', 'donasi.create', 'donasi.riwayat', 'donasi.riwayat_all', 'donasi.setor',
      'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create', 'keuangan.buku_kas',
      'laporan.donasi', 'laporan.penggunaan', 'laporan.mutasi',
      'pengaturan.view', 'pengaturan.kategori_donasi', 'pengaturan.metode_donasi', 'pengaturan.pos_pengeluaran', 'pengaturan.users', 'pengaturan.roles', 'pengaturan.logo'
    ]
  },
  {
    id: 'admin',
    name: 'Admin',
    permissions: [
      'dashboard.view', 'dashboard.kas', 'dashboard.kinerja',
      'donatur.view', 'donatur.create', 'donatur.edit', 'donatur.delete',
      'donasi.view', 'donasi.create', 'donasi.riwayat', 'donasi.riwayat_all', 'donasi.setor',
      'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create', 'keuangan.buku_kas',
      'laporan.donasi', 'laporan.penggunaan', 'laporan.mutasi',
      'pengaturan.view', 'pengaturan.kategori_donasi', 'pengaturan.metode_donasi', 'pengaturan.pos_pengeluaran', 'pengaturan.logo'
    ]
  },
  {
    id: 'bendahara',
    name: 'Bendahara',
    permissions: [
      'dashboard.view', 'dashboard.kas',
      'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create', 'keuangan.buku_kas',
      'laporan.donasi', 'laporan.penggunaan', 'laporan.mutasi'
    ]
  },
  {
    id: 'petugas',
    name: 'Petugas',
    permissions: [
      'dashboard.view',
      'donatur.view', 'donatur.create', 'donatur.edit',
      'donasi.view', 'donasi.create', 'donasi.riwayat', 'donasi.setor'
    ]
  },
  {
    id: 'pengawas',
    name: 'Pengawas',
    permissions: [
      'dashboard.view', 'dashboard.kas', 'dashboard.kinerja',
      'donatur.view',
      'donasi.view', 'donasi.riwayat', 'donasi.riwayat_all',
      'keuangan.view', 'keuangan.buku_kas',
      'laporan.donasi', 'laporan.penggunaan', 'laporan.mutasi'
    ]
  }
];

// Users
export const mockUsers = [
  { id: 'u1', name: 'Ahmad Fauzi', email: 'superadmin@arrosyad.id', password: 'admin123', roles: ['superadmin'], avatar: 'AF', alamat: 'Jl. Pesantren No. 1', noWa: '081234567890' },
  { id: 'u2', name: 'Siti Aminah', email: 'admin@arrosyad.id', password: 'admin123', roles: ['admin'], avatar: 'SA', alamat: 'Jl. Melati No. 5', noWa: '081234567891' },
  { id: 'u3', name: 'Hasan Basri', email: 'bendahara@arrosyad.id', password: 'admin123', roles: ['bendahara'], avatar: 'HB', alamat: 'Jl. Mawar No. 10', noWa: '081234567892' },
  { id: 'u4', name: 'Umar Hadi', email: 'petugas1@arrosyad.id', password: 'admin123', roles: ['petugas'], avatar: 'UH', alamat: 'Jl. Kenanga No. 3', noWa: '081234567893' },
  { id: 'u5', name: 'Fatimah Zahra', email: 'petugas2@arrosyad.id', password: 'admin123', roles: ['petugas'], avatar: 'FZ', alamat: 'Jl. Anggrek No. 12', noWa: '081234567894' },
  { id: 'u6', name: 'KH. Abdul Karim', email: 'pengawas@arrosyad.id', password: 'admin123', roles: ['pengawas'], avatar: 'AK', alamat: 'Komplek Ar-Rosyad', noWa: '081234567895' },
];

// Kategori Donasi
export const mockKategoriDonasi = [
  { id: 'kd1', nama: 'Kotak Infaq', deskripsi: 'Infaq dari kotak amal', aktif: true },
  { id: 'kd2', nama: 'Sedekah', deskripsi: 'Sedekah umum', aktif: true },
  { id: 'kd3', nama: 'Zakat Maal', deskripsi: 'Zakat harta', aktif: true },
  { id: 'kd4', nama: 'Zakat Fitrah', deskripsi: 'Zakat fitrah', aktif: true },
  { id: 'kd5', nama: 'Wakaf', deskripsi: 'Wakaf untuk pembangunan', aktif: true },
  { id: 'kd6', nama: 'Fidyah', deskripsi: 'Fidyah puasa', aktif: true },
  { id: 'kd7', nama: 'Qurban', deskripsi: 'Dana qurban', aktif: false },
];

// Metode Donasi
export const mockMetodeDonasi = [
  { id: 'md1', nama: 'Tunai', deskripsi: 'Pembayaran tunai langsung', aktif: true },
  { id: 'md2', nama: 'Transfer Bank BSI', deskripsi: 'Transfer via Bank Syariah Indonesia', aktif: true },
  { id: 'md3', nama: 'Transfer Bank BRI', deskripsi: 'Transfer via Bank BRI', aktif: true },
  { id: 'md4', nama: 'QRIS', deskripsi: 'Pembayaran via QRIS', aktif: true },
  { id: 'md5', nama: 'E-Wallet', deskripsi: 'GoPay, OVO, Dana, dll', aktif: true },
];

// Pos Pengeluaran
export const mockPosPengeluaran = [
  { id: 'pp1', nama: 'Operasional', deskripsi: 'Biaya operasional harian', aktif: true },
  { id: 'pp2', nama: 'Kegiatan Dakwah', deskripsi: 'Program dakwah dan pengajian', aktif: true },
  { id: 'pp3', nama: 'Pembangunan', deskripsi: 'Pembangunan fasilitas ponpes', aktif: true },
  { id: 'pp4', nama: 'Santunan Yatim', deskripsi: 'Bantuan untuk anak yatim', aktif: true },
  { id: 'pp5', nama: 'Pendidikan', deskripsi: 'Biaya pendidikan santri', aktif: true },
  { id: 'pp6', nama: 'Konsumsi', deskripsi: 'Biaya makan & minum', aktif: true },
];

// Donatur
export const mockDonatur = [
  {
    id: 'd1', nama: 'H. Muhammad Ridwan', kategori: 'Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kota Bandung', kecamatan: 'Coblong',
    kelurahan: 'Dago', keterangan: 'Jl. Ir. H. Juanda No. 100',
    linkGmaps: 'https://maps.google.com/?q=-6.8847,107.6131',
    noWa: '081234567890', createdAt: '2025-01-15', createdBy: 'u4'
  },
  {
    id: 'd2', nama: 'Ibu Saleha', kategori: 'Non Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kota Bandung', kecamatan: 'Cimahi Selatan',
    kelurahan: 'Cibeureum', keterangan: 'Perumahan Griya Asri Blok C-12',
    linkGmaps: 'https://maps.google.com/?q=-6.8882,107.5412',
    noWa: '082198765432', createdAt: '2025-02-20', createdBy: 'u4'
  },
  {
    id: 'd3', nama: 'Pak Dedi Kurniawan', kategori: 'Non Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kabupaten Bandung', kecamatan: 'Baleendah',
    kelurahan: 'Andir', keterangan: 'Kampung Cidahu RT 03/05',
    linkGmaps: 'https://maps.google.com/?q=-7.0001,107.6335',
    noWa: '085312345678', createdAt: '2025-03-10', createdBy: 'u5'
  },
  {
    id: 'd4', nama: 'Hj. Aisyah Nurfauziah', kategori: 'Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kota Bandung', kecamatan: 'Lengkong',
    kelurahan: 'Burangrang', keterangan: 'Jl. Burangrang No. 45',
    linkGmaps: 'https://maps.google.com/?q=-6.9241,107.6202',
    noWa: '087712345678', createdAt: '2025-04-05', createdBy: 'u4'
  },
  {
    id: 'd5', nama: 'Ustadz Mahmud', kategori: 'Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kota Bandung', kecamatan: 'Cibeunying Kaler',
    kelurahan: 'Sukaluyu', keterangan: 'Jl. PHH Mustofa No. 88',
    linkGmaps: 'https://maps.google.com/?q=-6.8976,107.6357',
    noWa: '081398765432', createdAt: '2025-05-12', createdBy: 'u5'
  },
  {
    id: 'd6', nama: 'Bu Ratna Dewi', kategori: 'Non Keluarga',
    provinsi: 'Jawa Barat', kota: 'Kabupaten Bandung Barat', kecamatan: 'Lembang',
    kelurahan: 'Lembang', keterangan: 'Jl. Grand Hotel No. 15',
    linkGmaps: 'https://maps.google.com/?q=-6.8121,107.6167',
    noWa: '089612345678', createdAt: '2025-06-01', createdBy: 'u4'
  },
];

// Donasi Records
export const mockDonasi = [
  { id: 'dn1', donaturId: 'd1', tanggal: '2025-06-01', kategoriDonasiId: 'kd1', metodeDonasiId: 'md1', nominal: 500000, petugasId: 'u4', status: 'terverifikasi', setoranId: 's1' },
  { id: 'dn2', donaturId: 'd2', tanggal: '2025-06-03', kategoriDonasiId: 'kd2', metodeDonasiId: 'md2', nominal: 1000000, petugasId: 'u4', status: 'terverifikasi', setoranId: 's1' },
  { id: 'dn3', donaturId: 'd3', tanggal: '2025-06-05', kategoriDonasiId: 'kd3', metodeDonasiId: 'md1', nominal: 2500000, petugasId: 'u5', status: 'terverifikasi', setoranId: 's2' },
  { id: 'dn4', donaturId: 'd4', tanggal: '2025-06-10', kategoriDonasiId: 'kd2', metodeDonasiId: 'md4', nominal: 750000, petugasId: 'u4', status: 'terverifikasi', setoranId: 's1' },
  { id: 'dn5', donaturId: 'd5', tanggal: '2025-06-15', kategoriDonasiId: 'kd1', metodeDonasiId: 'md1', nominal: 300000, petugasId: 'u5', status: 'menunggu_verifikasi', setoranId: 's3' },
  { id: 'dn6', donaturId: 'd1', tanggal: '2025-06-20', kategoriDonasiId: 'kd5', metodeDonasiId: 'md2', nominal: 5000000, petugasId: 'u4', status: 'menunggu_verifikasi', setoranId: 's3' },
  { id: 'dn7', donaturId: 'd6', tanggal: '2025-06-25', kategoriDonasiId: 'kd2', metodeDonasiId: 'md1', nominal: 200000, petugasId: 'u4', status: 'belum_disetor', setoranId: null },
  { id: 'dn8', donaturId: 'd3', tanggal: '2025-06-28', kategoriDonasiId: 'kd4', metodeDonasiId: 'md3', nominal: 1500000, petugasId: 'u5', status: 'belum_disetor', setoranId: null },
  { id: 'dn9', donaturId: 'd2', tanggal: '2025-07-01', kategoriDonasiId: 'kd1', metodeDonasiId: 'md1', nominal: 400000, petugasId: 'u4', status: 'ditolak', setoranId: 's3' },
  { id: 'dn10', donaturId: 'd4', tanggal: '2025-07-05', kategoriDonasiId: 'kd2', metodeDonasiId: 'md5', nominal: 600000, petugasId: 'u5', status: 'belum_disetor', setoranId: null },
];

// Setoran
export const mockSetoran = [
  {
    id: 's1', petugasId: 'u4', tanggal: '2025-06-05', status: 'terverifikasi',
    metodeDonasiId: 'md1', totalNominal: 1500000, keterangan: 'Setoran mingguan',
    verifikasiOleh: 'u3', tanggalVerifikasi: '2025-06-06', catatan: 'Diterima tunai'
  },
  {
    id: 's2', petugasId: 'u5', tanggal: '2025-06-08', status: 'terverifikasi',
    metodeDonasiId: 'md2', totalNominal: 2500000, keterangan: 'Transfer ke BSI',
    verifikasiOleh: 'u3', tanggalVerifikasi: '2025-06-09', catatan: ''
  },
  {
    id: 's3', petugasId: 'u4', tanggal: '2025-06-22', status: 'menunggu_verifikasi',
    metodeDonasiId: 'md1', totalNominal: 5700000, keterangan: 'Sisa kas',
    verifikasiOleh: null, tanggalVerifikasi: null, catatan: ''
  },
];

// Pengeluaran
export const mockPengeluaran = [
  { id: 'pg1', tanggal: '2025-06-15', sumberDanaId: 'md1', posPengeluaranId: 'pp1', nominal: 500000, keterangan: 'Bayar listrik bulan Juni', createdBy: 'u3' },
  { id: 'pg2', tanggal: '2025-06-18', sumberDanaId: 'md2', posPengeluaranId: 'pp2', nominal: 1500000, keterangan: 'Kegiatan pengajian rutin', createdBy: 'u3' },
  { id: 'pg3', tanggal: '2025-06-20', sumberDanaId: 'md1', posPengeluaranId: 'pp6', nominal: 300000, keterangan: 'Konsumsi kegiatan Jumat', createdBy: 'u3' },
  { id: 'pg4', tanggal: '2025-06-25', sumberDanaId: 'md4', posPengeluaranId: 'pp4', nominal: 750000, keterangan: 'Santunan anak yatim 5 orang', createdBy: 'u3' },
  { id: 'pg5', tanggal: '2025-07-01', sumberDanaId: 'md1', posPengeluaranId: 'pp5', nominal: 200000, keterangan: 'Beli buku pelajaran santri', createdBy: 'u3' },
];

// Saldo per Metode Donasi (computed from verified donations - expenses)
export const mockSaldo = [
  { metodeDonasiId: 'md1', saldo: 2000000 }, // Tunai: 500k + 2500k - 500k - 300k - 200k
  { metodeDonasiId: 'md2', saldo: 500000 },  // Transfer BSI: 1000k - 1500k (adjusted)
  { metodeDonasiId: 'md3', saldo: 0 },       // Transfer BRI
  { metodeDonasiId: 'md4', saldo: 0 },       // QRIS: 750k - 750k
  { metodeDonasiId: 'md5', saldo: 0 },       // E-Wallet
];

// Helper functions
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatTanggalShort(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function getStatusBadge(status) {
  switch(status) {
    case 'belum_disetor': return { label: 'Tercatat', variant: 'success' };
    case 'menunggu_verifikasi': return { label: 'Menunggu Verifikasi', variant: 'info' };
    case 'terverifikasi': return { label: 'Terverifikasi', variant: 'success' };
    case 'ditolak': return { label: 'Ditolak', variant: 'danger' };
    default: return { label: status, variant: 'neutral' };
  }
}

export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// Master Data: Pesan WA Template
export const mockPesanWa = `Assalamu'alaikum Bpk/Ibu {nama},

Terima kasih atas donasi sebesar {nominal} untuk kategori {kategori} yang telah kami terima pada tanggal {tanggal} melalui {metode}.

Semoga menjadi amal jariyah yang terus mengalir pahalanya. Aamiin.`;
