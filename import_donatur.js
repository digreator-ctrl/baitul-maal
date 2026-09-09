const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

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
  const content = fs.readFileSync('scratch_donatur.csv', 'utf8');
  const rows = parseCSV(content);
  
  let successCount = 0;
  for (const row of rows) {
    if (row.length < 9) continue;
    const [nama, noWa, alamat, provinsi, kabupaten, kecamatan, desa, link, kategori] = row;
    
    let lat = null;
    let lng = null;
    
    if (link) {
      const match = link.match(/q=(-?\d+(\.\d+)?)(,|%2C)(-?\d+(\.\d+)?)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[4]);
      } else {
        // Also handle maps.app.goo.gl? No, we can't resolve short links easily without an HTTP request.
        // We'll just leave lat/lng as null if it's a short link, and users can edit later if they want.
      }
    }
    
    try {
      await prisma.donatur.create({
        data: {
          nama: nama.trim(),
          noWa: noWa.trim(),
          alamat: alamat ? alamat.trim() : '-',
          provinsi: provinsi ? provinsi.trim() : null,
          kabupaten: kabupaten ? kabupaten.trim() : null,
          kecamatan: kecamatan ? kecamatan.trim() : null,
          desa: desa ? desa.trim() : null,
          lat,
          lng,
          kategori: kategori ? kategori.trim() : 'Keluarga',
          status: 'aktif',
          rutin: false
        }
      });
      successCount++;
      console.log(`Inserted: ${nama}`);
    } catch (err) {
      console.error(`Failed to insert ${nama}: ${err.message}`);
    }
  }
  console.log(`\nSuccessfully imported ${successCount} donaturs.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
