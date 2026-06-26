const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ventas = await prisma.venta.findMany({
    orderBy: { fecha: 'desc' },
    take: 20,
    include: {
      clienta: true,
      items: { include: { prenda: true } }
    }
  });
  
  console.log(`Encontrados ${ventas.length} pedidos:\n`);
  
  ventas.forEach((v, index) => {
    const prendasInfo = v.items.map(item => {
      const nombre = item.prenda ? item.prenda.nombre : 'Prenda Desconocida';
      return `${nombre} (Talla: ${item.talla || 'N/A'}, Cantidad: ${item.cantidad})`;
    }).join(' | ');

    const nombreClienta = v.clienta ? `${v.clienta.nombres} ${v.clienta.apellidos}` : 'Clienta Desconocida';
    const numOrden = index + 1;
    const fecha = new Date(v.fecha).toLocaleString('es-BO', { timeZone: 'America/La_Paz' });

    console.log(`${numOrden}. [${fecha}] ${nombreClienta}`);
    console.log(`   Pedido: ${prendasInfo}`);
    console.log(`   Estado: ${v.estado}`);
    console.log(`   -------------------------------------------------`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
