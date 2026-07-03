const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const clients = await prisma.venta.findMany({
    orderBy: {
      fecha: 'desc'
    },
    take: 10,
    include: {
      clienta: true
    }
  });

  console.log("=== Últimas 10 ventas ===");
  clients.forEach(sale => {
    console.log(`Clienta: ${sale.clienta?.nombres} ${sale.clienta?.apellidoPaterno}`);
    console.log(`Tipo: ${sale.tipoEntrega} | Destino: ${sale.destino} | Estado: ${sale.estado} | Total: ${sale.total}`);
    console.log('---');
  });
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
