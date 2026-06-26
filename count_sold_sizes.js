const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ventas = await prisma.venta.findMany({
    where: {
      estado: {
        in: ['PENDIENTE_VERIFICACION', 'PREPARANDO', 'ENVIADO', 'ENTREGADO']
      }
    },
    include: {
      items: true
    }
  });

  const tallasVendidas = {};

  ventas.forEach(venta => {
    venta.items.forEach(item => {
      const talla = item.talla || 'Sin Talla';
      const cantidad = item.cantidad || 1;
      
      if (!tallasVendidas[talla]) {
        tallasVendidas[talla] = 0;
      }
      tallasVendidas[talla] += cantidad;
    });
  });

  console.log('Tallas Vendidas (Pedidos Válidos):');
  Object.entries(tallasVendidas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([talla, cantidad]) => {
      console.log(`- ${talla}: ${cantidad}`);
    });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
