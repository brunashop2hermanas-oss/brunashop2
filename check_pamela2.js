const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  const clienta = await prisma.clienta.findFirst({
    where: { 
      nombres: { contains: 'Pamela', mode: 'insensitive' }, 
      apellidos: { contains: 'Choque', mode: 'insensitive' } 
    },
    include: { 
      ventas: { 
        include: { items: { include: { prenda: true } } }, 
        orderBy: { fecha: 'desc' } 
      } 
    }
  });
  
  if (!clienta) {
    console.log("Clienta not found");
    return;
  }
  
  console.log("Puntos:", clienta.puntos);
  let totalItemsBought = 0;
  
  for (const v of clienta.ventas) {
    console.log(`Venta: ${v.id} - ${v.fecha}`);
    for (const item of v.items) {
      const prenda = item.prenda;
      console.log(`  - ${prenda ? prenda.nombre : 'Eliminada'}, Cantidad: ${item.cantidad}, Conjunto: ${prenda?.isConjunto}, Piezas: ${prenda?.piezasId?.length || 0}`);
      totalItemsBought += item.cantidad;
    }
  }
  
  console.log("Total items comprados (segun cantidad en ventas):", totalItemsBought);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
