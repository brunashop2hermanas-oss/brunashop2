const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clienta = await prisma.clienta.findFirst({
    where: { 
      nombres: { contains: 'Pamela', mode: 'insensitive' }, 
      apellidos: { contains: 'Choque', mode: 'insensitive' } 
    },
    include: { 
      ventas: { 
        include: { items: { include: { prenda: true } } }, 
        orderBy: { fecha: 'desc' } 
      } 
    }
  });
  console.log(JSON.stringify(clienta, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
