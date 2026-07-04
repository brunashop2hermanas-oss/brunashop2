const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prendas = await prisma.prenda.findMany({ where: { estado: { not: 'AGOTADO' } } });
  let lowStockCount = 0;
  prendas.forEach(p => {
    let lowSize = false;
    if (p.stockPorTalla && typeof p.stockPorTalla === 'object') {
      Object.values(p.stockPorTalla).forEach(v => {
        if (parseInt(v) <= 2) lowSize = true;
      });
    }
    if (p.stockCount <= 3 || lowSize) {
      lowStockCount++;
      console.log(`- ${p.nombre} (Stock: ${p.stockCount})`);
    }
  });
  console.log('TOTAL PRENDAS LOW STOCK:', lowStockCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
