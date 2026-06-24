"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getClientas() {
  noStore();
  try {
    const clientas = await prisma.clienta.findMany({
      include: {
        ventas: {
          include: {
            items: {
              include: {
                prenda: true
              }
            }
          },
          orderBy: { fecha: 'desc' }
        }
      },
      orderBy: { puntos: "desc" },
    });
    
    // Transformar los datos para que coincidan con la estructura que espera la UI
    const clientasFormateadas = clientas.map(clienta => {
      const compras = clienta.ventas.flatMap(venta => 
        venta.items.map(item => ({
          prenda: item.prenda?.nombre || "Producto Eliminado",
          fecha: venta.fecha.toLocaleDateString(),
          hora: venta.fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          monto: item.precio * item.cantidad
        }))
      );
      
      return {
        id: clienta.id,
        nombre: `${clienta.nombres} ${clienta.apellidos}`.trim(),
        ci: clienta.ci,
        celular: clienta.celular,
        puntos: clienta.puntos,
        nivel: clienta.nivel,
        createdAt: clienta.createdAt,
        fechaRegistroRaw: clienta.createdAt.toISOString(),
        totalPedidos: clienta.ventas.length,
        dineroGastado: clienta.ventas.reduce((sum, v) => sum + v.total, 0),
        prendasCompradas: clienta.puntos, // Asumiendo 1 punto = 1 prenda
        compras: compras
      };
    });

    return { success: true, data: clientasFormateadas };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getClientaByCI(ci: string) {
  try {
    const clienta = await prisma.clienta.findUnique({
      where: { ci: ci.trim() }
    });
    
    if (clienta) {
      return { success: true, data: clienta };
    } else {
      return { success: false, error: "Clienta no encontrada" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function resetPuntosClientas() {
  try {
    await prisma.clienta.updateMany({
      data: { puntos: 0 }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
