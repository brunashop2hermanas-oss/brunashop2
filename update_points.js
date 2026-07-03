const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const evandra = await prisma.clienta.findFirst({
    where: { ci: '2372' }
  });

  if (evandra) {
    console.log("Found Evandra, updating points to 2...");
    const updated = await prisma.clienta.update({
      where: { id: evandra.id },
      data: { puntos: 2 }
    });
    console.log("Updated client:", updated);
  } else {
    console.log("Evandra not found by CI 2372");
  }
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
