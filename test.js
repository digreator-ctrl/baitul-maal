const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.donasi.findMany().then(d => {
  console.dir(d, { depth: null });
  prisma.$disconnect();
}).catch(console.error);
