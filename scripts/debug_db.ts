import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const prendas = await prisma.prenda.findMany({
    select: {
      nombre: true,
      colores: true,
      imagenesPorColor: true,
    }
  });
  console.log(JSON.stringify(prendas, null, 2));
}

main().finally(() => prisma.$disconnect());
