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
  const defaultPassword = await bcrypt.hash('admin123', 10);
  const users = [
    { id: 'u1', name: 'Ahmad Fauzi', email: 'superadmin@arrosyad.id', password: defaultPassword, roleId: 'superadmin', avatar: 'AF', alamat: 'Jl. Pesantren No. 1', noWa: '081234567890' },
    { id: 'u2', name: 'Siti Aminah', email: 'admin@arrosyad.id', password: defaultPassword, roleId: 'admin', avatar: 'SA', alamat: 'Jl. Melati No. 5', noWa: '081234567891' },
    { id: 'u3', name: 'Hasan Basri', email: 'bendahara@arrosyad.id', password: defaultPassword, roleId: 'bendahara', avatar: 'HB', alamat: 'Jl. Mawar No. 10', noWa: '081234567892' },
    { id: 'u4', name: 'Umar Hadi', email: 'petugas1@arrosyad.id', password: defaultPassword, roleId: 'petugas', avatar: 'UH', alamat: 'Jl. Kenanga No. 3', noWa: '081234567893' },
    { id: 'u5', name: 'Fatimah Zahra', email: 'petugas2@arrosyad.id', password: defaultPassword, roleId: 'petugas', avatar: 'FZ', alamat: 'Jl. Anggrek No. 12', noWa: '081234567894' },
    { id: 'u6', name: 'KH. Abdul Karim', email: 'pengawas@arrosyad.id', password: defaultPassword, roleId: 'pengawas', avatar: 'AK', alamat: 'Komplek Ar-Rosyad', noWa: '081234567895' },
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
