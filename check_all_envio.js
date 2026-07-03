const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const envios = await prisma.venta.findMany({
    where: {
      tipoEntrega: 'ENVIO'
    },
    orderBy: {
      fecha: 'desc'
    },
    select: {
      id: true,
      fecha: true,
      origen: true,
      destino: true,
      estado: true,
      metodoPago: true,
      total: true
    }
  });

  const posTiendaSales = await prisma.venta.findMany({
    where: {
      origen: 'POS',
      tipoEntrega: 'TIENDA'
    },
    orderBy: {
      fecha: 'desc'
    },
    take: 5,
    select: {
      id: true,
      fecha: true,
      origen: true,
      destino: true,
      estado: true,
      metodoPago: true,
      total: true
    }
  });

  console.log("=== Todas las ventas con ENVIO ===");
  console.log(JSON.stringify(envios, null, 2));

  console.log("\n=== Últimas 5 ventas POS marcadas como TIENDA (posibles errores anteriores) ===");
  console.log(JSON.stringify(posTiendaSales, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
