const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const recentSales = await prisma.venta.findMany({
    orderBy: {
      fecha: 'desc'
    },
    take: 5,
    include: {
      items: {
        include: {
          prenda: {
            select: { nombre: true }
          }
        }
      },
      clienta: {
        select: { nombres: true, apellidos: true }
      }
    }
  });

  console.log(JSON.stringify(recentSales, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
