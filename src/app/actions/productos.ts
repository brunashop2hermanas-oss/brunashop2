"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { limpiarReservasExpiradas } from "./ventas";

export async function getPrendas() {
  noStore();
  await limpiarReservasExpiradas();
  
  try {
    const prendas = await prisma.prenda.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    // Calcular stock de conjuntos dinámicamente
    const prendasMapeadas = prendas.map(p => {
      if (p.isConjunto && p.piezasId.length > 0) {
        const piezas = prendas.filter(p2 => p.piezasId.includes(p2.id));
        if (piezas.length > 0) {
          p.stockCount = Math.min(...piezas.map(pz => pz.stockCount));
        } else {
          p.stockCount = 0;
        }
      }
      return p;
    });

    return { success: true, data: prendasMapeadas };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createPrenda(data: any) {
  try {
    const prenda = await prisma.prenda.create({
      data: {
        nombre: data.nombre,
        costoProveedor: data.costoProveedor,
        precioVenta: data.precioVenta,
        precioOriginal: data.precioOriginal || null,
        categoria: data.categoria,
        coleccion: data.coleccion || null,
        marca: data.marca || null,
        tallas: data.tallas || [],
        stockPorTalla: data.stockPorTalla || {},
        colores: data.colores || [],
        material: data.material || null,
        imagenes: data.imagenes || [],
        stockCount: data.stockCount || 0,
        enLive: data.enLive || false,
        enPreventa: data.enPreventa || false,
        isConjunto: data.isConjunto || false,
        piezasId: data.piezasId || [],
        piezasDetalle: data.piezasDetalle || null,
      },
    });
    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true, data: prenda };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePrenda(id: string, data: any) {
  try {
    const prenda = await prisma.prenda.update({
      where: { id },
      data: {
        nombre: data.nombre,
        costoProveedor: data.costoProveedor,
        precioVenta: data.precioVenta,
        precioOriginal: data.precioOriginal !== undefined ? data.precioOriginal : undefined,
        categoria: data.categoria,
        coleccion: data.coleccion,
        marca: data.marca,
        tallas: data.tallas,
        stockPorTalla: data.stockPorTalla,
        colores: data.colores,
        material: data.material,
        imagenes: data.imagenes,
        stockCount: data.stockCount,
        enLive: data.enLive,
        enPreventa: data.enPreventa,
        isConjunto: data.isConjunto,
        piezasId: data.piezasId,
        piezasDetalle: data.piezasDetalle !== undefined ? data.piezasDetalle : undefined,
      },
    });
    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true, data: prenda };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePrenda(id: string) {
  try {
    await prisma.prenda.delete({
      where: { id },
    });
    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function procesarTransferenciasCombo(transferencias: Record<string, { cantidad: number, talla: string, color: string }>) {
  try {
    const piezaIds = Object.keys(transferencias);
    if (piezaIds.length === 0) return { success: true };

    const prendas = await prisma.prenda.findMany({
      where: { id: { in: piezaIds } }
    });

    let totalTransferido = 0;

    // Validar stock de cada pieza individual
    for (const piezaId of piezaIds) {
      const prenda = prendas.find(p => p.id === piezaId);
      if (!prenda) throw new Error(`Prenda ${piezaId} no encontrada`);

      const trans = transferencias[piezaId];
      if (trans.cantidad <= 0) continue;

      if (prenda.stockPorTalla && Object.keys(prenda.stockPorTalla).length > 0) {
        const stockTallaObj = prenda.stockPorTalla as Record<string, any>;
        let stockTalla = 0;
        if (typeof stockTallaObj[trans.talla] === 'object' && trans.color) {
           stockTalla = Number(stockTallaObj[trans.talla][trans.color] || 0);
        } else {
           stockTalla = Number(stockTallaObj[trans.talla] || 0);
        }
        if (stockTalla < trans.cantidad) {
          throw new Error(`La prenda ${prenda.nombre} no tiene suficiente stock en la talla ${trans.talla}${trans.color ? ' color ' + trans.color : ''}.`);
        }
      } else {
        if (prenda.stockCount < trans.cantidad) {
          throw new Error(`La prenda ${prenda.nombre} no tiene suficiente stock (requiere ${trans.cantidad}, tiene ${prenda.stockCount}).`);
        }
      }
      totalTransferido += trans.cantidad;
    }

    if (totalTransferido === 0) return { success: true };

    // Efectuar el descuento en transacción
    await prisma.$transaction(async (tx) => {
      for (const piezaId of piezaIds) {
        const trans = transferencias[piezaId];
        if (trans.cantidad <= 0) continue;
        const prenda = prendas.find(p => p.id === piezaId)!;

        if (prenda.stockPorTalla && Object.keys(prenda.stockPorTalla).length > 0) {
          const nuevoStockTalla = { ...(prenda.stockPorTalla as Record<string, any>) };
          if (typeof nuevoStockTalla[trans.talla] === 'object' && trans.color) {
            const current = Number(nuevoStockTalla[trans.talla][trans.color] || 0);
            nuevoStockTalla[trans.talla][trans.color] = Math.max(0, current - trans.cantidad).toString();
          } else {
            const current = Number(nuevoStockTalla[trans.talla] || 0);
            nuevoStockTalla[trans.talla] = Math.max(0, current - trans.cantidad).toString();
          }
          
          await tx.prenda.update({
            where: { id: prenda.id },
            data: { stockPorTalla: nuevoStockTalla }
          });
        } else {
          await tx.prenda.update({
            where: { id: prenda.id },
            data: { stockCount: prenda.stockCount - trans.cantidad }
          });
        }
      }
    });

    revalidatePath("/admin/productos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
