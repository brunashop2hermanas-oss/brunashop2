const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sales = await prisma.venta.findMany({
    where: {
      origen: 'POS',
      total: 280
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 3,
    include: {
      clienta: true
    }
  });

  console.log("=== Últimas 3 ventas POS por 280 Bs ===");
  sales.forEach(sale => {
    console.log(`Venta ID: ${sale.id}`);
    console.log(`Fecha: ${sale.fecha}`);
    console.log(`Tipo: ${sale.tipoEntrega} | Destino: ${sale.destino} | Estado: ${sale.estado}`);
    console.log(`Clienta: ${sale.clienta?.nombres} ${sale.clienta?.apellidoPaterno} (CI: ${sale.clienta?.ci})`);
    console.log('---');
  });
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
