const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Roles
  const roles = [
    {
      id: 'superadmin',
      name: 'Super Admin',
      permissions: [
        'dashboard.view', 'dashboard.kas', 'dashboard.kinerja',
        'donatur.view', 'donatur.create', 'donatur.edit', 'donatur.delete',
        'donasi.view', 'donasi.create', 'donasi.riwayat', 'donasi.riwayat_all', 'donasi.setor',
        'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create',
        'laporan.view', 'laporan.penerimaan_donasi', 'laporan.kolektabilitas', 'laporan.mutasi_setoran', 'laporan.realisasi_pengeluaran', 'laporan.buku_kas', 'laporan.posisi_saldo', 'laporan.aktivitas',
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
        'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create',
        'laporan.view', 'laporan.penerimaan_donasi', 'laporan.kolektabilitas', 'laporan.mutasi_setoran', 'laporan.realisasi_pengeluaran', 'laporan.buku_kas', 'laporan.posisi_saldo', 'laporan.aktivitas',
        'pengaturan.view', 'pengaturan.kategori_donasi', 'pengaturan.metode_donasi', 'pengaturan.pos_pengeluaran', 'pengaturan.logo'
      ]
    },
    {
      id: 'bendahara',
      name: 'Bendahara',
      permissions: [
        'dashboard.view', 'dashboard.kas',
        'keuangan.view', 'keuangan.verifikasi', 'keuangan.verifikasi_action', 'keuangan.pengeluaran', 'keuangan.pengeluaran_create',
        'laporan.view', 'laporan.penerimaan_donasi', 'laporan.kolektabilitas', 'laporan.mutasi_setoran', 'laporan.realisasi_pengeluaran', 'laporan.buku_kas', 'laporan.posisi_saldo', 'laporan.aktivitas'
      ]
    },
    {
      id: 'petugas',
      name: 'Petugas',
      permissions: [
        'dashboard.view',
        'donatur.view', 'donatur.create', 'donatur.edit',
        'donasi.view', 'donasi.create', 'donasi.riwayat', 'donasi.setor',
        'laporan.view', 'laporan.penerimaan_donasi', 'laporan.kolektabilitas', 'laporan.mutasi_setoran'
      ]
    },
    {
      id: 'pengawas',
      name: 'Pengawas',
      permissions: [
        'dashboard.view', 'dashboard.kas', 'dashboard.kinerja',
        'donatur.view',
        'donasi.view', 'donasi.riwayat', 'donasi.riwayat_all',
        'keuangan.view',
        'laporan.view', 'laporan.penerimaan_donasi', 'laporan.kolektabilitas', 'laporan.mutasi_setoran', 'laporan.realisasi_pengeluaran', 'laporan.buku_kas', 'laporan.posisi_saldo', 'laporan.aktivitas'
      ]
    }
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { id: r.id },
      update: { name: r.name, permissions: r.permissions },
      create: r,
    });
  }
  console.log('✅ Roles seeded');

  // 2. Seed Users
  // Menggunakan Environment Variable agar sangat aman, tidak ada data asli di kodingan
  const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@arrosyad.id';
  const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'admin123';
  
  const superadminPassword = await bcrypt.hash(adminPasswordRaw, 10);
  const users = [
    { 
      id: 'u-superadmin', 
      name: 'Super Admin', 
      email: adminEmail, 
      password: superadminPassword, 
      roleId: 'superadmin', 
      avatar: 'SA', 
      alamat: 'Sekretariat', 
      noWa: '08123456789' 
    }
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, password: u.password, avatar: u.avatar, alamat: u.alamat, noWa: u.noWa },
      create: {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        avatar: u.avatar,
        alamat: u.alamat,
        noWa: u.noWa,
      },
    });

    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: u.roleId } },
      update: {},
      create: { userId: user.id, roleId: u.roleId },
    });
  }
  console.log('✅ Users seeded');

  // 3. Seed Kategori Donasi
  const kategoriList = [
    { id: 'zakat', nama: 'Zakat Maal', deskripsi: 'Zakat harta/penghasilan' },
    { id: 'infak_terikat', nama: 'Infak Terikat (Pembangunan)', deskripsi: 'Pembangunan masjid & asrama santri' },
    { id: 'infak_umum', nama: 'Infak Umum', deskripsi: 'Operasional dakwah & pendidikan' },
    { id: 'wakaf', nama: 'Wakaf Produktif', deskripsi: 'Tanah & sarana pesantren' },
    { id: 'sedekah', nama: 'Sedekah Subuh', deskripsi: 'Sedekah harian santri yatim' },
  ];

  for (const k of kategoriList) {
    await prisma.kategoriDonasi.upsert({
      where: { id: k.id },
      update: { nama: k.nama, deskripsi: k.deskripsi },
      create: k,
    });
  }
  console.log('✅ Kategori Donasi seeded');

  // 4. Seed Metode Donasi (Kas / Bank)
  const metodeList = [
    { id: 'kas_tunai', nama: 'Kas Tunai Utama', jenis: 'tunai' },
    { id: 'bsi_utama', nama: 'BSI - 7123456789 (Baitul Maal)', nomorRekening: '7123456789', atasNama: 'Baitul Maal Ar-Rosyad', jenis: 'bank' },
    { id: 'bri_donasi', nama: 'BRI - 012345678901234 (Donasi)', nomorRekening: '012345678901234', atasNama: 'Yayasan Ar-Rosyad', jenis: 'bank' },
    { id: 'qris', nama: 'QRIS Baitul Maal', jenis: 'qris' },
  ];

  for (const m of metodeList) {
    await prisma.metodeDonasi.upsert({
      where: { id: m.id },
      update: { nama: m.nama, nomorRekening: m.nomorRekening, atasNama: m.atasNama, jenis: m.jenis },
      create: m,
    });
  }
  console.log('✅ Metode Donasi seeded');

  // 5. Seed Pos Pengeluaran
  const posList = [
    { id: 'pos_ops', nama: 'Operasional Kantor & Amil', deskripsi: 'Listrik, internet, ATK, akomodasi amil' },
    { id: 'pos_santri', nama: 'Beasiswa Santri Yatim/Dhuafa', deskripsi: 'SPP, makan, kitab santri' },
    { id: 'pos_bangunan', nama: 'Pembangunan Sarana', deskripsi: 'Bahan bangunan & tukang' },
    { id: 'pos_dakwah', nama: 'Kegiatan Dakwah & Sosial', deskripsi: 'Kajian, santunan masyarakat sekitar' },
  ];

  for (const p of posList) {
    await prisma.posPengeluaran.upsert({
      where: { id: p.id },
      update: { nama: p.nama, deskripsi: p.deskripsi },
      create: p,
    });
  }
  console.log('✅ Pos Pengeluaran seeded');

  // 6. Seed Pengaturan Default
  await prisma.pengaturanAplikasi.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      namaYayasan: 'Baitul Maal Ponpes Ar-Rosyad',
      alamat: 'Jl. Masjid Basyaruddin, RT 21 RW 05, Desa Bogem, Kec. Gurah, Kediri, Jawa Timur 64181',
      noWa: '085259838384',
      email: 'info@arrosyad.or.id',
      website: 'http://arrosyad.or.id',
      pesanWaDonasi: 'Jazakallahu khairan atas donasi yang telah disalurkan melalui Baitul Maal Ponpes Ar-Rosyad sebesar {nominal} untuk program {kategori}. Semoga menjadi amal jariyah yang berkah.',
      pesanWaReminder: 'Assalamu\'alaikum Bapak/Ibu {nama}, mengingatkan untuk komitmen infak rutin bulanan sebesar {nominal}. Jazakallah.',
    },
  });
  console.log('✅ Pengaturan Aplikasi seeded');

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
