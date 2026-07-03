const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const recentPOSSales = await prisma.venta.findMany({
    where: {
      origen: 'POS'
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

  console.log("Recent POS Sales:", JSON.stringify(recentPOSSales, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
