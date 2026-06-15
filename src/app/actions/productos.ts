"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function getPrendas() {
  noStore();
  try {
    const prendas = await prisma.prenda.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: prendas };
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
        categoria: data.categoria,
        coleccion: data.coleccion || null,
        tallas: data.tallas || [],
        colores: data.colores || [],
        material: data.material || null,
        imagenes: data.imagenes || [],
        stockCount: data.stockCount || 0,
        enLive: data.enLive || false,
        enPreventa: data.enPreventa || false,
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
      data,
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
