"use server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Helper para formatear bytes a MB/GB
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function getEspacioUtilizado() {
  try {
    // 1. Obtener tamaño de la base de datos (PostgreSQL)
    const result: any = await prisma.$queryRaw`SELECT pg_database_size(current_database()) as size`;
    const dbSizeBytes = result[0]?.size ? Number(result[0].size) : 0;
    
    revalidatePath('/', 'layout');
    return {
      success: true,
      data: {
        dbSize: formatBytes(dbSizeBytes),
        dbSizeBytes,
        storageSize: "No aplica (Imágenes en ImgBB)",
        storageSizeBytes: 0,
        fileCount: 0
      }
    };
  } catch (error: any) {
    console.error("Error al obtener el espacio utilizado:", error);
    return { success: false, error: error.message };
  }
}

export async function limpiarBaseDeDatos(desde: Date, hasta: Date, borrarComprobantes: boolean, borrarGuias: boolean) {
  try {
    // Asegurarse de que hasta cubra el día entero
    const endOfDay = new Date(hasta);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Buscar todas las ventas en ese rango de fechas
    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: desde,
          lte: endOfDay
        }
      },
      select: {
        id: true,
        comprobante: true,
        guiaEnvioUrl: true
      }
    });

    if (ventas.length === 0) {
      revalidatePath('/', 'layout');
      return { success: true, message: "No se encontraron registros en estas fechas." };
    }

    const ventasAActualizarComprobante: string[] = [];
    const ventasAActualizarGuia: string[] = [];

    ventas.forEach(venta => {
      if (borrarComprobantes && venta.comprobante) {
        ventasAActualizarComprobante.push(venta.id);
      }
      
      if (borrarGuias && venta.guiaEnvioUrl) {
        ventasAActualizarGuia.push(venta.id);
      }
    });

    // 2. Limpiar referencias en la BD (Update)
    // Usamos transaction para hacer ambas limpiezas de manera segura
    await prisma.$transaction(async (tx) => {
      if (ventasAActualizarComprobante.length > 0) {
        await tx.venta.updateMany({
          where: { id: { in: ventasAActualizarComprobante } },
          data: { comprobante: null }
        });
      }
      
      if (ventasAActualizarGuia.length > 0) {
        await tx.venta.updateMany({
          where: { id: { in: ventasAActualizarGuia } },
          data: { guiaEnvioUrl: null }
        });
      }
    });

    revalidatePath('/', 'layout');
    return { 
      success: true, 
      message: `Limpieza completada. Se limpiaron los registros de ${ventasAActualizarComprobante.length + ventasAActualizarGuia.length} comprobantes/guías en la base de datos.` 
    };

  } catch (error: any) {
    console.error("Error al limpiar la base de datos:", error);
    return { success: false, error: error.message };
  }
}
