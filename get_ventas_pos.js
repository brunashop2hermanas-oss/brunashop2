const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const ventas = await prisma.venta.findMany({
    where: { origen: 'POS' },
    include: {
      clienta: true,
      items: {
        include: { prenda: true }
      }
    },
    orderBy: {
      fecha: 'desc'
    }
  });
  
  let md = '# Registro de Ventas Directas (POS)\n\n';
  md += `Total de ventas directas: ${ventas.length}\n\n`;
  
  for (const v of ventas) {
    md += `## Venta ID: ${v.id}\n`;
    md += `- **Fecha**: ${new Date(v.fecha).toLocaleString()}\n`;
    md += `- **Total**: Bs. ${v.total}\n`;
    md += `- **Método de Pago**: ${v.metodoPago}\n`;
    md += `- **Estado**: ${v.estado}\n`;
    
    if (v.clienta) {
      md += `- **Clienta**: ${v.clienta.nombres} ${v.clienta.apellidos} (CI: ${v.clienta.ci}, Celular: ${v.clienta.celular})\n`;
    } else {
      md += `- **Clienta**: No registrada\n`;
    }
    
    md += `- **Artículos (${v.items.length})**:\n`;
    for (const item of v.items) {
      md += `  - ${item.cantidad}x ${item.prenda ? item.prenda.nombre : 'Prenda eliminada'} (Talla: ${item.talla || 'N/A'}, Color: ${item.color || 'N/A'}) - Bs. ${item.precio}\n`;
    }
    md += '\n---\n\n';
  }
  
  fs.writeFileSync('C:/Users/abrah/.gemini/antigravity-ide/brain/f0a4a06b-3992-4b83-8d81-c2682ccb856f/ventas_directas_registro.md', md, 'utf-8');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
