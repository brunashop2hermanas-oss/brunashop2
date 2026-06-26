const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prendas = await prisma.prenda.findMany({
    where: {
      nombre: { contains: 'Combo Brunas', mode: 'insensitive' }
    }
  });
  console.log(JSON.stringify(prendas, null, 2));
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
