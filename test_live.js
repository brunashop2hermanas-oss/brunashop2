const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Primero, marcamos todas las prendas existentes como NO live para que esté limpio
  await prisma.prenda.updateMany({
    where: {},
    data: { enLive: false }
  });

  // Buscamos si hay alguna prenda para marcarla como Live
  const prendas = await prisma.prenda.findMany({ take: 2 });
  
  if (prendas.length > 0) {
    for (const p of prendas) {
      await prisma.prenda.update({
        where: { id: p.id },
        data: { enLive: true }
      });
      console.log(`Prenda existente "${p.nombre}" marcada como EN LIVE.`);
    }
  } else {
    // Si no hay prendas, creamos unas de prueba
    await prisma.prenda.create({
      data: {
        nombre: "Blusa Boutique Premium",
        costoProveedor: 50,
        precioVenta: 120,
        categoria: "Blusas y Tops",
        stockCount: 10,
        enLive: true,
        imagenes: ["https://images.unsplash.com/photo-1434389678232-04ce6c58a56a?w=500&q=80"]
      }
    });
    await prisma.prenda.create({
      data: {
        nombre: "Vestido de Noche Colección",
        costoProveedor: 100,
        precioVenta: 250,
        categoria: "Vestidos",
        stockCount: 5,
        enLive: true,
        imagenes: ["https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=500&q=80"]
      }
    });
    console.log("Prendas de prueba creadas y marcadas como EN LIVE.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
