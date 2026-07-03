const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const checkSales = await prisma.venta.findMany({
    where: {
      metodoPago: 'EFECTIVO',
      tipoEntrega: 'ENVIO'
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 5
  });

  console.log("Sales with EFECTIVO and ENVIO:", JSON.stringify(checkSales, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
