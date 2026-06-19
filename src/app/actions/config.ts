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
  instagramUrl?: string;
  tiktokUrl?: string;
  whatsappUrl?: string;
  footerDescripcion?: string;
  terminosCondiciones?: string;
  politicasEnvio?: string;
  usarControlFinanciero?: boolean;
  liveActivo?: boolean;
  tiempoReservaMinutos?: number;
  tiempoLlenadoDatosMinutos?: number;
  destinosHabilitados?: any;
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

    return { success: true, message: "Destinos habilitados actualizados correctamente." };
  } catch (error: any) {
    console.error("Error al guardar destinos:", error);
    return { success: false, error: error.message };
  }
}

export async function actualizarPlanSupabase(plan: string) {
  try {
    const conf = await prisma.configuracion.upsert({
      where: { id: 1 },
      update: { planSupabase: plan },
      create: { id: 1, planSupabase: plan }
    });
    return { success: true, data: conf };
  } catch (error: any) {
    console.error("Error al actualizar plan Supabase:", error);
    return { success: false, error: error.message };
  }
}
