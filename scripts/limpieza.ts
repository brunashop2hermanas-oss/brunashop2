import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando limpieza de la base de datos...");

  await prisma.ventaItem.deleteMany({});
  console.log("VentaItems borrados");

  await prisma.venta.deleteMany({});
  console.log("Ventas borradas");

  await prisma.clienta.deleteMany({});
  console.log("Clientas borradas");

  await prisma.prenda.deleteMany({});
  console.log("Prendas borradas");

  const usersDeleted = await prisma.user.deleteMany({
    where: {
      username: {
        not: 'bruna'
      }
    }
  });
  console.log(`Usuarios extras borrados: ${usersDeleted.count} (Administrador 'bruna' conservado)`);

  console.log("Limpieza de base de datos terminada con éxito.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
