const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.ventaItem.findMany({
    where: { prendaId: 'cmqu2retu0001gz2bt7h9yawh' },
    include: { venta: true }
  });

  let sm = 0;
  let lxl = 0;
  let sm_pendientes = 0;
  let lxl_pendientes = 0;
  
  for (const item of items) {
    if (['ENTREGADO', 'ENVIADO', 'PREPARANDO'].includes(item.venta.estado)) {
      if (item.talla === 'S/M') sm += item.cantidad;
      if (item.talla === 'L/XL') lxl += item.cantidad;
    } else if (['ESPERANDO_PAGO', 'PENDIENTE_VERIFICACION'].includes(item.venta.estado)) {
      if (item.talla === 'S/M') sm_pendientes += item.cantidad;
      if (item.talla === 'L/XL') lxl_pendientes += item.cantidad;
    }
  }

  console.log('Vendidas Confirmadas -> S/M:', sm, '| L/XL:', lxl);
  console.log('Apartadas (Pendientes) -> S/M:', sm_pendientes, '| L/XL:', lxl_pendientes);
}

main().catch(console.error).finally(() => prisma.$disconnect());
