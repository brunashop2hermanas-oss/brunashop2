"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from 'next/cache';

export async function checkLiveNotificationsStatus() {
  noStore();
  try {
    const configuracion = await prisma.configuracion.findFirst({
      select: { liveActivo: true },
    });

    const liveCount = await prisma.prenda.count({
      where: { enLive: true },
    });

    const liveActivo = configuracion?.liveActivo ?? false;
    const itemsInLive = liveCount > 0;

    return {
      liveActivo,
      itemsInLive,
      liveCount,
      needsMasterButtonReminder: itemsInLive && !liveActivo,
    };
  } catch (error) {
    console.error("Error al verificar notificaciones:", error);
    return {
      liveActivo: false,
      itemsInLive: false,
      liveCount: 0,
      needsMasterButtonReminder: false,
    };
  }
}
