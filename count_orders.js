const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ventas = await prisma.venta.findMany({
    where: {
      estado: {
        in: ['PENDIENTE_VERIFICACION', 'PREPARANDO', 'ENVIADO', 'ENTREGADO']
      }
    },
    orderBy: { fecha: 'desc' },
    include: {
      clienta: true,
      items: { include: { prenda: true } }
    }
  });
  
  let countSM = 0;
  let countLXL = 0;
  
  ventas.forEach(v => {
    v.items.forEach(item => {
      if (item.talla === 'S/M') countSM += item.cantidad;
      else if (item.talla === 'L/XL') countLXL += item.cantidad;
    });
  });
  
  console.log(`Pedidos vigentes totales: ${ventas.length}`);
  console.log(`Talla S/M: ${countSM}`);
  console.log(`Talla L/XL: ${countLXL}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
