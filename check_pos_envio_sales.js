const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const posEnvioSales = await prisma.venta.findMany({
    where: {
      origen: 'POS',
      tipoEntrega: 'ENVIO'
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 5,
    include: {
      clienta: {
        select: { nombres: true, apellidos: true }
      }
    }
  });

  console.log("Recent POS ENVIO Sales:", JSON.stringify(posEnvioSales, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
