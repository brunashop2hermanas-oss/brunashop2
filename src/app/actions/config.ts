"use server";
import { revalidatePath } from "next/cache";

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

    // Lógica para Live Programado Recurrente
    if (config.liveHorariosRecurrentes && typeof config.liveHorariosRecurrentes === 'object' && !Array.isArray(config.liveHorariosRecurrentes)) {
      const data = config.liveHorariosRecurrentes as { horarios?: { diaSemana: number, hora: string, unSoloUso?: boolean }[], ultimaActivacion?: string };
      if (data.horarios && data.horarios.length > 0) {
        // Ajuste de zona horaria para Bolivia (UTC-4)
        const now = new Date();
        const nowBolivia = new Date(now.getTime() - (4 * 60 * 60 * 1000));
        
        const hoyDia = nowBolivia.getUTCDay(); // 0=Dom, 1=Lun, ..., 6=Sab
        const horaStr = nowBolivia.getUTCHours().toString().padStart(2, '0') + ':' + nowBolivia.getUTCMinutes().toString().padStart(2, '0');
        const hoyStr = nowBolivia.toISOString().split('T')[0];

        // Buscar si hay un horario programado que deba activarse hoy/ahora
        let toActivate = false;
        let isOneTime = false;
        let horarioToRemove: any = null;

        for (const h of data.horarios) {
          if (h.diaSemana === hoyDia && horaStr >= h.hora) {
            // Activa si es un solo uso, o si es frecuente y no se ha activado hoy
            if (h.unSoloUso || data.ultimaActivacion !== hoyStr) {
              toActivate = true;
              if (h.unSoloUso) {
                isOneTime = true;
                horarioToRemove = h;
              }
              break;
            }
          }
        }

        if (toActivate) {
          config.liveActivo = true;
          
          let newHorarios = data.horarios;
          if (isOneTime && horarioToRemove) {
            newHorarios = newHorarios.filter(h => h !== horarioToRemove);
          }

          const newJson = {
            ...data,
            horarios: newHorarios,
            ultimaActivacion: isOneTime ? data.ultimaActivacion : hoyStr
          };

          await prisma.configuracion.update({
            where: { id: config.id },
            data: { 
              liveActivo: true, 
              liveHorariosRecurrentes: newJson
            }
          });
          config.liveHorariosRecurrentes = newJson;
        }
      }
    }

    revalidatePath('/', 'layout');
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
  facebookUrl?: string;
  whatsappUrl?: string;
  footerDescripcion?: string;
  terminosCondiciones?: string;
  politicasEnvio?: string;
  politicaPrivacidad?: string;
  politicaDevoluciones?: string;
  identidadTienda?: string;
  jurisdiccion?: string;
  usarControlFinanciero?: boolean;
  liveActivo?: boolean;
  tiempoReservaMinutos?: number;
  tiempoLlenadoDatosMinutos?: number;
  destinosHabilitados?: any;
  categoriasPrendas?: string[];
  liveHorariosRecurrentes?: any;
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

    revalidatePath('/', 'layout');
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
    revalidatePath('/', 'layout');
    return { success: true, data: conf };
  } catch (error: any) {
    console.error("Error al actualizar plan Supabase:", error);
    return { success: false, error: error.message };
  }
}
