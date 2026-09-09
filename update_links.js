const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const csvText = `Nama,No WA,Alamat,Provinsi,Kabupataen / Kota,Kecamatan,Desa / Kelurahan,Link,Kategori
Abu Abdillah,081556727083,Jl. Joyoboyo,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,BOGEM,,Keluarga
Abu Ibrahim Hafi,085649116441,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Abu Jafron,085784749491,Jl. Raya Mojoroto,JAWA TIMUR,KOTA KEDIRI,KEDIRI,MOJOROTO,,Keluarga
Aditya Rifa,085645719632,Blabak,JAWA TIMUR,KOTA KEDIRI,PESANTREN,BLABAK,https://maps.app.goo.gl/hWCfCBcbne8njeYR8,Keluarga
Afrizal Suhari,082113628969,Bekasi,JAWA BARAT,KOTA BEKASI,BEKASI,BEKASI,,Keluarga
Anang,081230118655,Wonosari,JAWA TIMUR,KABUPATEN KEDIRI,PAGU,WONOSARI,,Keluarga
Andik Hartono,085859460800,Jl. Surya,JAWA TIMUR,KABUPATEN KEDIRI,RINGINREJO,SAMBI,https://maps.app.goo.gl/15jLUMdkUwLb57vG6,Keluarga
Andri Setiawan,081330628710,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Aris,089509901904,Jl. Cangkring,JAWA TIMUR,KOTA BLITAR,CANGKRING,CANGKRING,,Keluarga
AWW GOR Kota Kediri,081227972270,Jl. Raya Kediri GOR,JAWA TIMUR,KOTA KEDIRI,MOJOROTO,BANJARMLATI,https://maps.app.goo.gl/oFrvDxA4kQezra8u5,Non Keluarga
AWW Kertosono,081227972270,Jl. Raya Kertosono,JAWA TIMUR,KABUPATEN NGANJUK,KERTOSONO,PANDANTOYO,https://maps.app.goo.gl/rT72oGVkUNekcLzX7,Non Keluarga
AWW Ngadiluwih,081235569733,Jl. Raya Ngadiluwih,JAWA TIMUR,KABUPATEN KEDIRI,NGADILUWIH,PURWOKERTO,https://maps.app.goo.gl/g2iJjPJi2qZ6D4Dy5,Non Keluarga
AWW Nganjuk,081227972270,Jl. Raya Nganjuk,JAWA TIMUR,KOTA NGANJUK,NGANJUK,,,Non Keluarga
AWW Ngasem,081227972270,Jl. Raya Ngasem,JAWA TIMUR,KOTA KEDIRI,NGASEM,NGASEM,https://maps.app.goo.gl/gcX7QEqA6YBXVCxZ7,Non Keluarga
AWW Ngasem,081235569733,Ngasem,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Non Keluarga
AWW Ngronggo,081227972270,Jl. Raya Ngronggo,JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,NGRONGGO,https://maps.app.goo.gl/mxKbaADB8eQGC1tc9,Non Keluarga
AWW Pare,081227972270,Jl. Raya Tulungrejo,JAWA TIMUR,KABUPATEN KEDIRI,PARE,TULUNGREJO,https://maps.app.goo.gl/rtmAD2MTrqrxRBGz9,Non Keluarga
AWW Ponorogo,085258729223,Jl. Raya Ponorogo,JAWA TIMUR,KABUPATEN PONOROGO,PONOROGO,KEPATIHAN,https://maps.app.goo.gl/i9aw4peMxot1VDYU8,Non Keluarga
AWW Warujayeng,081227972270,Jl. Raya Warujayeng,JAWA TIMUR,KABUPATEN NGANJUK,TANJUNGANOM,TANJUNGANOM,https://maps.app.goo.gl/6vH1HoA3XzaPGnnA7,Non Keluarga
AWW Wates,081227972270,Jl. Raya Wates,JAWA TIMUR,KABUPATEN KEDIRI,WATES,TAWANG,https://maps.app.goo.gl/8iShG2868NKPZ7yh7,Non Keluarga
Bobi Rohman,082230363000,Jl. Raya Kediri,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Keluarga
Bu Edy Triono (Lilik Ema Nurfarida),081335578343,Jl. Terusan Pamenang,JAWA TIMUR,KABUPATEN KEDIRI,NGASEM,SUKOREJO,https://maps.app.goo.gl/GaDn8BHZ7AASS6r86,Keluarga
Bu Mahmud,081556540295,Gurah,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,GURAH,,Keluarga
Dawud,085649095613,Depan Mushola Petung,JAWA TIMUR,KOTA KEDIRI,RINGINREJO,SAMBI,,Keluarga
Dewinta Vitria M,0818531760,"Tirtasani Royal Resort, Cluster Tirta Pelangi Blok I-2 No. 22",JAWA TIMUR,KABUPATEN MALANG,KARANGPLOSO,KEPUHARJO,https://maps.app.goo.gl/NFPD4L1JAoymqYfV7,Keluarga
Dimas,082231306461,Jl. Raya Kedungwaru,JAWA TIMUR,KABUPATEN TULUNGAGUNG,KEDUNGWARU,KEDUNGWARU,,Keluarga
Doni Aprizal,081332703588,Jl. Raya Kediri Wates No 01 RT 33 RW 08 Dusun Sumber Asih,JAWA TIMUR,KABUPATEN KEDIRI,WATES,SUMBERAGUNG,,Keluarga
Dr. Anita Sulies Setyarani,085746832789,,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Dr. Luzi,085334014428,Jl. Bolowono RT 01 RW 01,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,TIRU LOR,https://maps.google.com/maps?q=-7.805332%2C112.137264&z=17&hl=id,Keluarga
Dr. Norman Sp. B,081216543442,RSUD SLG,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Keluarga
Ena Pratama,081252459459,Jl. Raya Wonodadi,JAWA TIMUR,KABUPATEN BLITAR,WONODADI,WONODADI,,Keluarga
Erwan Prasetya,081259399294,Jl. Raya Kediri,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Keluarga
Erwan Prasetyo,081259399294,Rampoang,SULAWESI SELATAN,KOTA PALOPO,BARA,RAMPOANG,https://maps.google.com/maps?q=-2.9301731%2C120.1794187&z=17&hl=id,Keluarga
Fajar Rahayu,081235569733,Jl. Raya Kediri,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Keluarga
Fifi Tilome,081344344645,Jl. Ahamad Yani Serui Jaya,PAPUA,KABUPATEN KEPULAUAN YAPEN,YAPEN SELATAN,SERUI JAYA,https://maps.app.goo.gl/gCSNCMDSHNZ7DHwa7,Keluarga
Hadi Munawar,081359459417,Jl. Sunan Giri,JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,REJOMULYO,https://maps.google.com/maps?q=-7.8490213%2C112.0262797&z=17&hl=id,Keluarga
Hanzah,0811362060,Blitar,JAWA TIMUR,KOTA BLITAR,KEPANJENKIDUL,KEPANJENKIDUL,https://maps.app.goo.gl/hhf98Xp9HyHHAdnm7,Keluarga
Haryanto,085736759740,Bedali,JAWA TIMUR,KABUPATEN KEDIRI,NGANCAR,BEDALI,https://maps.app.goo.gl/zJxpfgXwU4qx12Kp7,Keluarga
Hawai Martabak Pare,081227972270,Jl. Raya Pare,JAWA TIMUR,KABUPATEN KEDIRI,PARE,TULUNGREJO,https://maps.app.goo.gl/YMTTJRsEBz5YnxLy5,Non Keluarga
Hendra Setiawan,08990432740,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Ibu Kasriyani,085655685973,Wonojoyo,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,WONOJOYO,https://maps.app.goo.gl/CMKuxaMQig9gfQWb8,Keluarga
Ibu Nurmalela,081945389332,Jl. Semeru,JAWA TIMUR,KOTA KEDIRI,MOJOROTO,CAMPUREJO,https://maps.google.com/maps?q=-7.8276278%2C111.9914424&z=17&hl=id,Keluarga
Ibu Pasriyabti,085225941367,Perumahan Sapphire Residence Blok 6I-11,JAWA TIMUR,KABUPATEN SIDOARJO,BUDURAN,PRASUNG,https://maps.google.com/maps?q=-7.4255451%2C112.7530949&z=17&hl=id,Keluarga
Irfan Rahmanto,081235311260,Jl. Raya Kediri,JAWA TIMUR,KOTA KEDIRI,KEDIRI,KEDIRI,,Keluarga
Ismuhadi,085546492189,Pare,JAWA TIMUR,KABUPATEN KEDIRI,PARE,PARE,,Keluarga
Jefri Ardian Nugroho,081243012895,"Perumahan Graha Nusa 3 Blok A 15, Kab. Mamuju Sulawesi Barat",SULAWESI BARAT,KABUPATEN MAMUJU,SIMBORO DAN KEPULAUAN,SIMBORO,https://maps.app.goo.gl/GnGPY1h7A45HhNCt5,Keluarga
Joko Ahfantoro,08123404437,Puhrubuh,JAWA TIMUR,KABUPATEN KEDIRI,SEMEN,PUHRUBUH,https://maps.app.goo.gl/h18nNbJCgqAavwPD6,Keluarga
Kefi Marela,0811222128,Dau,JAWA TIMUR,KABUPATEN MALANG,DAU,DAU,,Keluarga
Khafid Dwi Pradana,081234442882,Jl. Tokyo No. 12S Dusun Banjarejo RT 18 RW  06,JAWA TIMUR,KABUPATEN JOMBANG,SUMOBITO,SEGODOREJO,https://maps.app.goo.gl/8jAfbYfNi3xrRgGMA?g_st=ic,Keluarga
Khusnul,085100655510,Jl. Raya Sukun Malang,JAWA TIMUR,KOTA MALANG,SUKUN,SUKUN,,Keluarga
Khusnul Taufiq,082234536373,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Komunitas Cahaya Surga (Farid Suhartini),0816554002,Jl. Pemandian Perum BI No. B2 Bandar Lor Kediri,JAWA TIMUR,KOTA KEDIRI,MOJOROTO,BANDAR LOR,https://maps.google.com/maps?q=-7.8206767%2C111.9992032&z=17&hl=id,Non Keluarga
Moh Mekrot,081359630708,Jl. Ngasinan Raya,JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,REJOMULYO,https://maps.google.com/maps?q=-7.8500152%2C112.0252998&z=17&hl=id,Keluarga
Mohammad Alfi Fahmi,085655518055,Losari,JAWA TIMUR,KABUPATEN MALANG,SINGOSARI,LOSARI,https://maps.app.goo.gl/4JVMxf7sEBqn5xiJ8,Keluarga
Muchammad Riyadi,081325738096,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Muchammad Riyadi,081325738096,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Muh Sa'dus Sulton,0818384228,"Jl. Semangka, Corekan Raya RT 01 RW 05 64129",JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,KALIOMBO,https://maps.app.goo.gl/47eG911AwMXitRNf7,Keluarga
Muhammad Iqbal,085228564050,Jl. Banjar Lingkungan Muhajirin,NUSA TENGGARA BARAT,KABUPATEN SUMBAWA BARAT,TALIWANG,BUGIS,https://maps.google.com/maps?q=-8.7435137%2C116.8341903&z=17&hl=id,Keluarga
Nuril Huda,081310567234,Jl. Mushola At Taqwa,JAWA BARAT,KOTA DEPOK,CINERE,GANDUL,https://maps.google.com/maps?q=-6.3343207%2C106.7949701&z=17&hl=id,Keluarga
Pak Azhari,082141964227,Jl. Urip Sumoharjo No. 66,JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,KALIOMBO,https://maps.google.com/maps?q=-7.8302505%2C112.0098998&z=17&hl=id,Keluarga
Pak Karyadi,081232985409,Perum Bukit Permai A4 Mojoroto Kota Kediri,JAWA TIMUR,KOTA KEDIRI,MOJOROTO,BANDAR LOR,https://maps.app.goo.gl/ZqZs7RnhCm8zohpS6,Keluarga
Pak Supingi (Yuly Peristiowati),08125924339,Kediri,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Sapto Nugroho,081259747058,,JAWA TIMUR,KABUPATEN KEDIRI,KEDIRI,KEDIRI,,Keluarga
Septian Fauzi,0818034647522,Jl. Raya Banyuanyar RT 04 RW 01,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,BANYUANYAR,https://maps.app.goo.gl/5RMbgq7yRMa8ByJD8?g_st=iw,Keluarga
Siti Fatimah,08113313746,Dusun Krajan Lor,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,WONOJOYO,https://maps.google.com/maps?q=-7.8226583%2C112.0768555&z=17&hl=id,Keluarga
Sri Jabat Kaban,081226999966,Jl. Raya Kandat,JAWA TIMUR,KABUPATEN KEDIRI,KANDAT,KANDAT,,Keluarga
Sri Widodo,081555351838,Jl. Sambi,JAWA TIMUR,KABUPATEN KEDIRI,RINGINREJO,SAMBI,https://maps.app.goo.gl/TZVkPXiZ82vTBdR26,Keluarga
Sriono,085855949502,Cangkring AWW,JAWA TIMUR,KABUPATEN BLITAR,CANGKRING,CANGKRING,,Keluarga
Supriadi,085335222351,Pamenang,JAWA TIMUR,KABUPATEN KEDIRI,PAMENANG,PAMENANG,,Keluarga
Syaiku,081271120123,Tangerang,BANTEN,KOTA TANGERANG,TANGERANG,TANGERANG,,Keluarga
Tito Wardoyo,081310368634,Malang,JAWA TIMUR,KOTA MALANG,MALANG,MALANG,,Keluarga
Toni Wijaya,085791388833,Jl. Jaksa Agung Suprapto Gg. Jaka Sambang No. 11 Kemisik,JAWA TIMUR,KABUPATEN PASURUAN,PANDAN,SUMBER GEDANG,https://maps.app.goo.gl/6P3o76zS2xyPs8Qw9,Keluarga
Wahyu,08113502605,Kalimantan,JAWA TIMUR,KOTA KEDIRI,RINGINREJO,SRIKATON,,Keluarga
Wahyudi (Rahma Diani),085755749708,Sumbercangkring,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,SUMBERCANGKRING,https://maps.app.goo.gl/BSXcuvBHjHsMByF97,Keluarga
Widya R,081234415734,Babadan,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,SUMBERCANGKRING,,Keluarga
Wildan,082140784095,Jl. Raya Sambi,JAWA TIMUR,KOTA KEDIRI,RINGINREJO,SAMBI,,Keluarga
Windy Ratna Wulansari,081232015678,Jl. Balowerti Gg. 1 No. 9 RT 13 RW 04,JAWA TIMUR,KOTA KEDIRI,KOTA KEDIRI,BALOWERTI,https://maps.app.goo.gl/NMzQ1oNBSfn5fw5k7,Keluarga
Yossi Apriana,081332068164,Jl. Pemuda No. 86,JAWA TIMUR,KABUPATEN KEDIRI,GURAH,KERKEP,https://maps.app.goo.gl/CVYNiJ4bBGNqxkwx7,Keluarga
Yoyok Suprianto,085331009646,Jl. Desa Wates,JAWA TIMUR,KABUPATEN KEDIRI,WATES,WATES,,Keluarga
Zaka Bandung,08112253531,Bandung,JAWA BARAT,KOTA BANDUNG,BANDUNG,BANDUNG,,Keluarga`;

function parseCSV(text) {
  const lines = text.trim().replace(/\r/g, '').split('\n');
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const row = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && line[j+1] === '"') {
        current += '"';
        j++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current);
    results.push(row);
  }
  return results;
}

async function main() {
  const rows = parseCSV(csvText);
  
  let successCount = 0;
  for (const row of rows) {
    if (row.length < 9) continue;
    const [nama, noWa, alamat, provinsi, kabupaten, kecamatan, desa, link, kategori] = row;
    
    if (!link) continue;
    
    try {
      const donaturs = await prisma.donatur.findMany({
        where: {
          nama: nama.trim(),
          noWa: noWa.trim()
        }
      });
      
      for (const d of donaturs) {
        await prisma.donatur.update({
          where: { id: d.id },
          data: {
            linkGmaps: link.trim()
          }
        });
        successCount++;
        console.log(`Updated link for: ${nama}`);
      }
    } catch (err) {
      console.error(`Failed to update ${nama}: ${err.message}`);
    }
  }
  console.log(`\nSuccessfully updated links for ${successCount} donaturs.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
