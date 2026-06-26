const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  let config = await prisma.configuracion.findFirst();
  if (config) {
    await prisma.configuracion.update({
      where: { id: config.id },
      data: { planSupabase: "Pro" }
    });
    console.log("Plan actualizado a Pro.");
  } else {
    await prisma.configuracion.create({
      data: { planSupabase: "Pro" }
    });
    console.log("Configuración creada y plan asignado a Pro.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
