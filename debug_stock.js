const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const prendas = await prisma.prenda.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, nombre: true, stockCount: true, stockPorTalla: true }
  });
  console.log(JSON.stringify(prendas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
