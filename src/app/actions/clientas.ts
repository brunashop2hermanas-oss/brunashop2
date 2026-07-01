"use server";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getClientas(orderByField: 'puntos' | 'createdAt' | 'updatedAt' = 'puntos', orderByDirection: 'asc' | 'desc' = 'desc') {
  noStore();
  try {
    const clientas = await prisma.clienta.findMany({
      include: {
        ventas: {
          where: {
            estado: {
              notIn: ["CANCELADO", "CANCELADO_POR_TIEMPO"]
            }
          },
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
      orderBy: { [orderByField]: orderByDirection },
    });
    
    const clientasFormateadas = clientas.map(clienta => {
      const compras = clienta.ventas.flatMap(venta => 
        venta.items.map(item => ({
          ventaId: venta.id,
          prenda: item.prenda?.nombre || "Producto Eliminado",
          talla: item.talla,
          color: item.color,
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
        compras: compras,
        updatedAt: clienta.updatedAt,
      };
    });

    // No quitar revalidatePath aquí si se requiere limpiar cache global de layout, 
    // pero para performance es mejor no hacerlo en GET requests. Sin embargo, noStore() ya desactiva el cache.
    // revalidatePath('/', 'layout'); // Comentado para evitar validaciones de cache innecesarias en GET
    
    return { 
      success: true, 
      data: clientasFormateadas,
    };
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
      revalidatePath('/', 'layout');
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
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateClienta(id: string, data: { nombres?: string; apellidos?: string; ci?: string; celular?: string }) {
  try {
    const clienta = await prisma.clienta.update({
      where: { id },
      data: {
        ...(data.nombres && { nombres: data.nombres }),
        ...(data.apellidos && { apellidos: data.apellidos }),
        ...(data.ci && { ci: data.ci }),
        ...(data.celular && { celular: data.celular })
      }
    });
    revalidatePath('/', 'layout');
    return { success: true, data: clienta };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteClienta(id: string) {
  try {
    const { getUserRole } = await import('@/app/actions/auth');
    const role = await getUserRole();
    if (role !== "ADMINISTRADOR") {
      throw new Error("No tienes permisos de Administrador para eliminar clientas.");
    }

    await prisma.clienta.delete({
      where: { id }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
