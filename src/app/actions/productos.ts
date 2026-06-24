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

async function adjustPiecesStock(tx: any, piezasDetalle: any, combosCount: number, action: 'deduct' | 'restore') {
  if (!piezasDetalle) return;
  const detailObj = typeof piezasDetalle === 'string' ? JSON.parse(piezasDetalle) : piezasDetalle;
  
  for (const piezaId in detailObj) {
    const pz = detailObj[piezaId];
    const qtyPerCombo = Number(pz.cantidad) || 0;
    if (qtyPerCombo <= 0) continue;
    const totalQty = qtyPerCombo * combosCount;
    if (totalQty === 0) continue;

    const prenda = await tx.prenda.findUnique({ where: { id: pz.id } });
    if (!prenda) continue;

    let newStockCount = prenda.stockCount;
    let newStockPorTalla = { ...(prenda.stockPorTalla as any || {}) };

    if (action === 'deduct') {
      newStockCount = Math.max(0, newStockCount - totalQty);
      
      if (pz.tallaEspecifica) {
        if (typeof newStockPorTalla[pz.tallaEspecifica] === 'object') {
           const color = pz.colorEspecifico || 'Unico';
           const current = Number(newStockPorTalla[pz.tallaEspecifica][color] || 0);
           newStockPorTalla[pz.tallaEspecifica][color] = Math.max(0, current - totalQty).toString();
        } else {
           const current = Number(newStockPorTalla[pz.tallaEspecifica] || 0);
           newStockPorTalla[pz.tallaEspecifica] = Math.max(0, current - totalQty).toString();
        }
      }
    } else if (action === 'restore') {
      newStockCount = newStockCount + totalQty;
      
      if (pz.tallaEspecifica) {
        if (typeof newStockPorTalla[pz.tallaEspecifica] === 'object') {
           const color = pz.colorEspecifico || 'Unico';
           const current = Number(newStockPorTalla[pz.tallaEspecifica][color] || 0);
           newStockPorTalla[pz.tallaEspecifica][color] = (current + totalQty).toString();
        } else {
           const current = Number(newStockPorTalla[pz.tallaEspecifica] || 0);
           newStockPorTalla[pz.tallaEspecifica] = (current + totalQty).toString();
        }
      }
    }

    await tx.prenda.update({
      where: { id: prenda.id },
      data: { stockCount: newStockCount, stockPorTalla: newStockPorTalla }
    });
  }
}

export async function createPrenda(data: any) {
  try {
    const prenda = await prisma.$transaction(async (tx) => {
      const p = await tx.prenda.create({
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
          descripcionLarga: data.descripcionLarga || null,
        },
      });

      if (data.isConjunto && data.piezasDetalle && data.stockCount > 0) {
        await adjustPiecesStock(tx, data.piezasDetalle, data.stockCount, 'deduct');
      }

      return p;
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
    const prenda = await prisma.$transaction(async (tx) => {
      const oldPrenda = await tx.prenda.findUnique({ where: { id } });
      
      // Restaurar el stock viejo antes de aplicar los nuevos cambios
      if (oldPrenda && oldPrenda.isConjunto && oldPrenda.piezasDetalle && oldPrenda.stockCount > 0) {
        await adjustPiecesStock(tx, oldPrenda.piezasDetalle, oldPrenda.stockCount, 'restore');
      }

      const p = await tx.prenda.update({
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
          descripcionLarga: data.descripcionLarga !== undefined ? data.descripcionLarga : undefined,
        },
      });

      // Deducir el stock nuevo en base a las nuevas reglas
      if (p.isConjunto && p.piezasDetalle && p.stockCount > 0) {
        await adjustPiecesStock(tx, p.piezasDetalle, p.stockCount, 'deduct');
      }

      return p;
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
    await prisma.$transaction(async (tx) => {
      const oldPrenda = await tx.prenda.findUnique({ where: { id } });
      
      // Si era un conjunto, devolvemos las piezas al inventario libre
      if (oldPrenda && oldPrenda.isConjunto && oldPrenda.piezasDetalle && oldPrenda.stockCount > 0) {
        await adjustPiecesStock(tx, oldPrenda.piezasDetalle, oldPrenda.stockCount, 'restore');
      }

      await tx.prenda.delete({
        where: { id },
      });
    });

    revalidatePath("/admin/productos");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
