/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// Inicializa el cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = "brunashop2";

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
    
    // 2. Obtener tamaño del almacenamiento de imágenes (Supabase Storage)
    let storageSizeBytes = 0;
    let fileCount = 0;
    
    // Obtenemos una estimación listando los archivos
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      limit: 10000,
      offset: 0,
    });
    
    if (!error && data) {
      fileCount = data.length;
      storageSizeBytes = data.reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
    }

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: {
        dbSize: formatBytes(dbSizeBytes),
        dbSizeBytes,
        storageSize: formatBytes(storageSizeBytes),
        storageSizeBytes,
        fileCount
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

    const archivosAborrar: string[] = [];
    const ventasAActualizarComprobante: string[] = [];
    const ventasAActualizarGuia: string[] = [];

    ventas.forEach(venta => {
      if (borrarComprobantes && venta.comprobante) {
        // Extraer la ruta del archivo de Supabase de la URL completa
        // Ej: https://.../storage/v1/object/public/bruna-shop-images/171123123.jpg -> "171123123.jpg"
        const parts = venta.comprobante.split(`${BUCKET_NAME}/`);
        if (parts.length > 1) {
          archivosAborrar.push(parts[1]);
          ventasAActualizarComprobante.push(venta.id);
        }
      }
      
      if (borrarGuias && venta.guiaEnvioUrl) {
        const parts = venta.guiaEnvioUrl.split(`${BUCKET_NAME}/`);
        if (parts.length > 1) {
          archivosAborrar.push(parts[1]);
          ventasAActualizarGuia.push(venta.id);
        }
      }
    });

    let deletedFilesCount = 0;

    // 1. Borrar archivos de Supabase
    if (archivosAborrar.length > 0) {
      // Supabase remove() toma un array de rutas
      const { data, error } = await supabase.storage.from(BUCKET_NAME).remove(archivosAborrar);
      if (error) {
        throw new Error(`Error borrando archivos: ${error.message}`);
      }
      deletedFilesCount = data?.length || 0;
    }

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
      message: `Limpieza completada. Se liberaron ${deletedFilesCount} imágenes del servidor y se limpiaron los registros. Las ventas de texto siguen intactas.` 
    };

  } catch (error: any) {
    console.error("Error al limpiar la base de datos:", error);
    return { success: false, error: error.message };
  }
}
