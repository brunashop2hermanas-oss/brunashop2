"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getConfiguracion() {
  noStore();
  try {
    let config = await prisma.configuracion.findFirst();
    if (!config) {
      config = await prisma.configuracion.create({
        data: {}
      });
    }
    return { success: true, data: config };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateConfiguracion(data: {
  bancoNombre?: string;
  bancoCuenta?: string;
  bancoTitular?: string;
  qrImagen?: string | null;
}) {
  try {
    let config = await prisma.configuracion.findFirst();
    if (!config) {
      config = await prisma.configuracion.create({ data: {} });
    }

    const updated = await prisma.configuracion.update({
      where: { id: config.id },
      data
    });

    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
