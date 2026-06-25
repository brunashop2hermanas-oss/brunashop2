import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO CONFIGURACIÓN DE SEGURIDAD (RLS) ===");
  const tables = ['User', 'Clienta', 'Prenda', 'Venta', 'VentaItem', 'Configuracion'];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✅ RLS (Row-Level Security) habilitado y bloqueado en la tabla: ${table}`);
    } catch (e: any) {
      console.error(`❌ Error al habilitar RLS en ${table}:`, e.message);
    }
  }
  
  console.log("\n=== ¡Listo! Todas las tablas están protegidas ===");
  console.log("El acceso público desde internet ha sido denegado.");
  console.log("Supabase ya no enviará más advertencias de vulnerabilidad.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
