const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prendas = await prisma.prenda.findMany({
    where: {
      nombre: { contains: "Combo Brunas", mode: "insensitive" }
    },
    include: {
      ventaItems: {
        include: {
          venta: true
        }
      }
    }
  });

  if (prendas.length === 0) {
    console.log("No se encontró el producto 'Combo Brunas'.");
    return;
  }

  for (const prenda of prendas) {
    console.log(`\nProducto: ${prenda.nombre} (ID: ${prenda.id})`);
    
    const tallasVendidas = {};
    let totalVendidas = 0;

    for (const item of prenda.ventaItems) {
      // Ignorar ventas canceladas o expiradas
      if (item.venta.estado === "CANCELADO" || item.venta.estado === "CANCELADO_POR_TIEMPO") {
        continue;
      }
      
      const talla = item.talla || "Unico";
      const color = item.color || "Unico";
      const key = `${talla} - ${color}`;
      
      if (!tallasVendidas[key]) {
        tallasVendidas[key] = 0;
      }
      tallasVendidas[key] += item.cantidad;
      totalVendidas += item.cantidad;
    }

    console.log(`Total de ventas exitosas para este producto: ${totalVendidas}`);
    console.log("Desglose por Talla/Color:");
    if (Object.keys(tallasVendidas).length === 0) {
      console.log("  Ninguna venta registrada aún.");
    } else {
      for (const [key, cant] of Object.entries(tallasVendidas)) {
        console.log(`  - ${key}: ${cant} vendidas`);
      }
    }
  }
}

run()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
