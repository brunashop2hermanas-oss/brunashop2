const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prendas = await prisma.prenda.findMany();
  let fixedCount = 0;

  for (const prenda of prendas) {
    if (prenda.stockPorTalla) {
      let changed = false;
      let stock = JSON.parse(JSON.stringify(prenda.stockPorTalla)); // deep copy

      for (const talla in stock) {
        if (typeof stock[talla] === 'object') {
          for (const color in stock[talla]) {
            if (stock[talla][color] === 'NaN' || Number.isNaN(Number(stock[talla][color]))) {
              stock[talla][color] = "0";
              changed = true;
            }
          }
        } else {
          if (stock[talla] === 'NaN' || Number.isNaN(Number(stock[talla]))) {
            stock[talla] = "0";
            changed = true;
          }
        }
      }

      if (changed) {
        await prisma.prenda.update({
          where: { id: prenda.id },
          data: { stockPorTalla: stock }
        });
        console.log(`Fixed Prenda ID: ${prenda.id} (${prenda.nombre})`);
        fixedCount++;
      }
    }
  }
  
  console.log(`Finished. Fixed ${fixedCount} prendas.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
