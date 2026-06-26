const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const prendas = await prisma.prenda.findMany({
    where: { nombre: { contains: 'Combo Brunas', mode: 'insensitive' } },
    include: {
      ventaItems: {
        include: { venta: true }
      }
    }
  });

  if (prendas.length === 0) return;

  for (const prenda of prendas) {
    let pending = 0;
    let prep = 0;
    
    for (const item of prenda.ventaItems) {
      if (item.venta.estado === 'ESPERANDO_PAGO' || item.venta.estado === 'PENDIENTE_VERIFICACION') {
        pending += item.cantidad;
      } else if (item.venta.estado === 'PREPARANDO') {
        prep += item.cantidad;
      }
    }
    
    console.log(`Prenda ID: ${prenda.id}`);
    console.log(`En carritos / Esperando Pago / Verificando: ${pending}`);
    console.log(`En Preparación: ${prep}`);
  }
}

run().finally(() => prisma.$disconnect());
