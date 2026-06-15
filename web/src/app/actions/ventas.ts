"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";

export async function createVenta(data: {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  ci: string;
  celular: string;
  ciudadDestino: string;
  comprobanteUrl?: string;
  items: { prendaId: string; cantidad: number; precioUnitario: number }[];
  total: number;
  origen?: string;
  estado?: string;
}) {
  try {
    const nombreCompleto = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim();
    const prendasTotales = data.items.reduce((acc, item) => acc + item.cantidad, 0);

    const ciLimpio = data.ci.trim();
    const celularLimpio = data.celular.trim();

    // Iniciar transacción para asegurar que todo se guarde correctamente
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar o Crear Clienta
      let clienta = await tx.clienta.findUnique({
        where: { ci: ciLimpio }
      });

      if (clienta) {
        clienta = await tx.clienta.update({
          where: { id: clienta.id },
          data: {
            nombres: data.nombres,
            apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim(),
            celular: celularLimpio,
            puntos: { increment: prendasTotales },
          }
        });
      } else {
        clienta = await tx.clienta.create({
          data: {
            nombres: data.nombres,
            apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim(),
            ci: ciLimpio,
            celular: celularLimpio,
            puntos: prendasTotales,
          }
        });
      }

      // 2. Crear la Venta
      const venta = await tx.venta.create({
        data: {
          clientaId: clienta.id,
          total: data.total,
          metodoPago: "TRANSFERENCIA_QR",
          comprobante: data.comprobanteUrl,
          estado: data.estado || "PENDIENTE_VERIFICACION",
          destino: data.ciudadDestino,
          origen: data.origen || "WEB",
          tipoEntrega: "ENVIO",
          items: {
            create: data.items.map(item => ({
              prendaId: item.prendaId,
              cantidad: item.cantidad,
              precio: item.precioUnitario
            }))
          }
        }
      });

      // 3. Descontar Stock de las Prendas
      for (const item of data.items) {
        await tx.prenda.update({
          where: { id: item.prendaId },
          data: {
            stockCount: {
              decrement: item.cantidad
            }
          }
        });
      }

      return venta;
    });

    revalidatePath("/admin/clientas");
    revalidatePath("/admin/productos");
    revalidatePath("/admin/pedidos");
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVentas() {
  noStore();
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        clienta: true,
        items: {
          include: {
            prenda: true
          }
        }
      }
    });

    // Mapear al formato que usa la UI actual de Pedidos
    const dataFormateada = ventas.map(v => ({
      id: v.id,
      cliente: v.clienta ? `${v.clienta.nombres} ${v.clienta.apellidos}` : 'Cliente Desconocido',
      celular: v.clienta?.celular || '',
      ci: v.clienta?.ci || '',
      destino: v.destino || 'No especificado',
      total: v.total,
      estado: v.estado === 'PENDIENTE_VERIFICACION' ? 'Pendiente' : 
              v.estado === 'RECHAZADO' ? 'Rechazado' : 'Aprobado',
      fecha: v.fecha.toLocaleString(),
      comprobanteUrl: v.comprobante || "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=400&q=80",
      puntosClienta: v.clienta?.puntos || 0,
      origen: v.origen,
      registradoPor: null, // Podría ser el usuario logueado en el futuro
      articulos: v.items.map(item => ({
        id: item.id,
        nombre: item.prenda.nombre,
        cantidad: item.cantidad,
        talla: "N/A", // Si las prendas tuvieran talla específica por item habría que extraerlo
        color: "N/A",
        empaquetado: item.empaquetado
      }))
    }));

    return { success: true, data: dataFormateada };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEstadoVenta(ventaId: string, nuevoEstado: string) {
  try {
    // Convertimos los estados de UI a Base de Datos
    let estadoDB = 'PENDIENTE_VERIFICACION';
    if (nuevoEstado === 'Aprobado') estadoDB = 'PREPARANDO';
    if (nuevoEstado === 'Rechazado') estadoDB = 'RECHAZADO';

    await prisma.venta.update({
      where: { id: ventaId },
      data: { estado: estadoDB }
    });
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleEmpaquetado(ventaItemId: string, estadoActual: boolean) {
  try {
    await prisma.ventaItem.update({
      where: { id: ventaItemId },
      data: { empaquetado: !estadoActual }
    });
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
