"use server";

import prisma from "@/lib/prisma";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { headers, cookies } from "next/headers";

async function ajustarStock(tx: any, prendaId: string, cantidad: number, operacion: 'increment' | 'decrement', talla?: string | null, color?: string | null) {
  const prendaInfo = await tx.prenda.findUnique({ where: { id: prendaId } });
  if (!prendaInfo) return;

  const piezasToUpdate = prendaInfo.isConjunto && prendaInfo.piezasId.length > 0 ? prendaInfo.piezasId : [prendaId];

  for (const pId of piezasToUpdate) {
    const pInfo = await tx.prenda.findUnique({ where: { id: pId } });
    if (!pInfo) continue;

    let updatedData: any = { stockCount: { [operacion]: cantidad } };

    if (talla && pInfo.stockPorTalla) {
      const stockObj = pInfo.stockPorTalla;
      if (stockObj[talla]) {
        if (typeof stockObj[talla] === 'object' && color) {
          const currentStock = parseInt(stockObj[talla][color] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla][color] = newStock.toString();
        } else {
          const currentStock = parseInt(stockObj[talla] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla] = newStock.toString();
        }
        updatedData.stockPorTalla = stockObj;
      }
    }

    const updated = await tx.prenda.update({ where: { id: pId }, data: updatedData });
    if (updated.stockCount <= 0) {
      await tx.prenda.update({ where: { id: pId }, data: { estado: "AGOTADO", stockCount: 0 } });
    } else if (operacion === 'increment' && updated.estado === "AGOTADO") {
      await tx.prenda.update({ where: { id: pId }, data: { estado: "DISPONIBLE" } });
    }
  }
}


export async function buscarClientaPorCI(ci: string) {
  try {
    const clienta = await prisma.clienta.findUnique({
      where: { ci: ci.trim() }
    });
    revalidatePath('/', 'layout');
    return { success: true, data: clienta };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVenta(ventaId: string) {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: { items: { include: { prenda: true } }, clienta: true }
    });
    revalidatePath('/', 'layout');
    return { success: true, data: venta, serverNow: new Date().toISOString() };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function crearReservaAnonima(data: {
  items: { prendaId: string; cantidad: number; precioUnitario: number; talla?: string; color?: string }[];
  total: number;
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const config = await tx.configuracion.findFirst();
      const tiempoPaso1 = config?.tiempoLlenadoDatosMinutos || 10;
      
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + tiempoPaso1);

      const venta = await tx.venta.create({
        data: {
          total: data.total,
          metodoPago: "TRANSFERENCIA_QR",
          estado: "ESPERANDO_PAGO",
          origen: "WEB",
          tipoEntrega: "ENVIO",
          expiresAt: expiresAt,
          items: {
            create: data.items.map(item => ({
              prendaId: item.prendaId,
              cantidad: item.cantidad,
              precio: item.precioUnitario,
              talla: item.talla || null,
              color: item.color || null
            }))
          }
        }
      });

      // Descontar Stock para reservar
      for (const item of data.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'decrement', item.talla, item.color);
      }
      return venta;
    });

    revalidatePath("/admin/productos");
    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function vincularClientaReserva(ventaId: string, data: {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  ci: string;
  celular?: string;
  ciudadDestino: string;
  provinciaDestino?: string;
  municipioDestino?: string;
  receptorDiferente?: boolean;
  receptorNombres?: string;
  receptorApPaterno?: string;
  receptorApMaterno?: string;
  receptorCi?: string;
  receptorCelular?: string;
  empresaBusesPreferida?: string;
  tiempoReservaMinutos: number;
  clientIp?: string;
}) {
  try {
    const ciLimpio = data.ci.trim();
    
    let ipAceptacion = data.clientIp || "IP no detectada";
    try {
      const headersList = await headers();
      const headerIp = headersList.get("x-forwarded-for")?.split(',')[0] || headersList.get("x-real-ip");
      if (headerIp) ipAceptacion = headerIp;
    } catch(e) {}

    const result = await prisma.$transaction(async (tx) => {
      // Buscar o Crear Clienta
      let clienta = await tx.clienta.findUnique({ where: { ci: ciLimpio } });
      
      if (!clienta && data.nombres && data.apellidoPaterno && data.celular) {
        clienta = await tx.clienta.create({
          data: {
            nombres: data.nombres,
            apellidos: `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim(),
            ci: ciLimpio,
            celular: data.celular.trim(),
            puntos: 0,
          }
        });
      } else if (clienta && data.nombres && data.apellidoPaterno && data.celular) {
        // Actualizar datos si la clienta editó su información
        const nuevosApellidos = `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim();
        if (clienta.nombres !== data.nombres || clienta.apellidos !== nuevosApellidos || clienta.celular !== data.celular) {
          clienta = await tx.clienta.update({
            where: { id: clienta.id },
            data: {
              nombres: data.nombres,
              apellidos: nuevosApellidos,
              celular: data.celular.trim(),
            }
          });
        }
      }

      if (!clienta) {
        throw new Error("Clienta no encontrada y no se enviaron datos para registro.");
      }

      // El verdadero tiempo del cronómetro inicia aquí, cuando pasan al código QR
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + data.tiempoReservaMinutos);

      // Vincular a la Venta existente
      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          clientaId: clienta.id,
          destino: data.ciudadDestino,
          provinciaDestino: data.provinciaDestino,
          municipioDestino: data.municipioDestino,
          receptorDiferente: data.receptorDiferente,
          receptorNombres: data.receptorNombres,
          receptorApPaterno: data.receptorApPaterno,
          receptorApMaterno: data.receptorApMaterno,
          receptorCi: data.receptorCi,
          receptorCelular: data.receptorCelular,
          empresaBusesPreferida: data.empresaBusesPreferida,
          expiresAt: expiresAt,
          terminosAceptados: true,
          fechaAceptacion: new Date(),
          ipAceptacion: ipAceptacion
        }
      });

      return ventaActualizada;
    });

    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function confirmarPagoCheckout(ventaId: string, data: {
  comprobanteUrl: string;
  depositanteNombres: string;
  depositanteApPaterno: string;
  depositanteApMaterno?: string;
  depositanteCi?: string;
  depositanteCuenta?: string;
}) {
  try {
    const venta = await prisma.venta.findUnique({ where: { id: ventaId }, include: { items: true } });
    if (!venta) throw new Error("Venta no encontrada");
    if (venta.estado !== "ESPERANDO_PAGO") throw new Error("Esta venta ya no está esperando pago.");

    const result = await prisma.$transaction(async (tx) => {
      // Marcar Venta como pagada (Pendiente Verificacion)
      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          estado: "PENDIENTE_VERIFICACION",
          comprobante: data.comprobanteUrl,
          depositanteNombres: data.depositanteNombres,
          depositanteApPaterno: data.depositanteApPaterno,
          depositanteApMaterno: data.depositanteApMaterno,
          depositanteCuenta: data.depositanteCuenta,
          expiresAt: null // Limpiar expiración
        }
      });

      // Sumar puntos a clienta
      const prendasTotales = venta.items.reduce((acc, item) => acc + item.cantidad, 0);
      if (venta.clientaId) {
        await tx.clienta.update({
          where: { id: venta.clientaId },
          data: { puntos: { increment: prendasTotales } }
        });
      }
      return ventaActualizada;
    });

    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cancelarVentaExpirada(ventaId: string) {
  try {
    const venta = await prisma.venta.findUnique({ where: { id: ventaId }, include: { items: true } });
    if (!venta || venta.estado !== "ESPERANDO_PAGO") revalidatePath('/', 'layout');
    return { success: true, message: "No requiere acción" };

    await prisma.$transaction(async (tx) => {
      // 1. Restaurar stock
      for (const item of venta.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'increment', item.talla, item.color);
      }

      // 2. Marcar Venta como CANCELADO_POR_TIEMPO
      await tx.venta.update({
        where: { id: ventaId },
        data: { estado: "CANCELADO_POR_TIEMPO", expiresAt: null }
      });
    });

    revalidatePath("/admin/productos");
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function limpiarReservasExpiradas() {
  try {
    const ahora = new Date();
    const ventasExpiradas = await prisma.venta.findMany({
      where: {
        estado: 'ESPERANDO_PAGO',
        expiresAt: { lte: ahora }
      },
      select: { id: true }
    });

    for (const venta of ventasExpiradas) {
      await cancelarVentaExpirada(venta.id);
    }
  } catch (error) {
    console.error("Error limpiando reservas expiradas:", error);
  }
}

export async function createVenta(data: {
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  ci?: string;
  celular?: string;
  ciudadDestino: string;
  provinciaDestino?: string;
  tipoEntrega?: string;
  metodoPago?: string;
  comprobanteUrl?: string;
  items: { prendaId: string; cantidad: number; precioUnitario: number; talla?: string; color?: string }[];
  total: number;
  origen?: string;
  estado?: string;
}) {
  try {
    const nombreCompleto = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim();
    const prendasTotales = data.items.reduce((acc, item) => acc + item.cantidad, 0);

    const ciLimpio = data.ci ? data.ci.trim() : "";
    const celularLimpio = data.celular ? data.celular.trim() : "";

    // Iniciar transacción para asegurar que todo se guarde correctamente
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buscar o Crear Clienta si hay CI
      let clientaId = null;
      if (ciLimpio !== "") {
        let clienta = await tx.clienta.findUnique({
          where: { ci: ciLimpio }
        });

        if (clienta) {
          clienta = await tx.clienta.update({
            where: { id: clienta.id },
            data: {
              nombres: data.nombres || clienta.nombres,
              apellidos: (data.apellidoPaterno ? `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim() : clienta.apellidos),
              celular: celularLimpio || clienta.celular,
              puntos: { increment: prendasTotales },
            }
          });
        } else {
          clienta = await tx.clienta.create({
            data: {
              nombres: data.nombres || "Anónimo",
              apellidos: data.apellidoPaterno ? `${data.apellidoPaterno} ${data.apellidoMaterno || ""}`.trim() : "",
              ci: ciLimpio,
              celular: celularLimpio,
              puntos: prendasTotales,
            }
          });
        }
        clientaId = clienta.id;
      }

      // 2. Crear la Venta
      let vendedorId = null;
      try {
        const cookieStore = await cookies();
        const storedUserId = cookieStore.get("bruna_user_id")?.value;
        if (storedUserId) {
          vendedorId = storedUserId;
        }
      } catch(e) {}

      const venta = await tx.venta.create({
        data: {
          clientaId: clientaId,
          vendedorId: vendedorId,
          total: data.total,
          metodoPago: data.metodoPago || "TRANSFERENCIA_QR",
          comprobante: data.comprobanteUrl,
          estado: data.estado || "PENDIENTE_VERIFICACION",
          destino: data.ciudadDestino,
          provinciaDestino: data.provinciaDestino || null,
          origen: data.origen || "WEB",
          tipoEntrega: data.tipoEntrega || "ENVIO",
          items: {
            create: data.items.map(item => ({
              prendaId: item.prendaId,
              cantidad: item.cantidad,
              precio: item.precioUnitario,
              talla: item.talla || null,
              color: item.color || null
            }))
          }
        }
      });

      // 3. Descontar Stock de las Prendas
      for (const item of data.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'decrement', item.talla, item.color);
      }

      return venta;
    });

    revalidatePath("/admin/clientas");
    revalidatePath("/admin/productos");
    revalidatePath('/', 'layout');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVentas() {
  noStore();
  await limpiarReservasExpiradas();
  
  try {
    const ventas = await prisma.venta.findMany({
      orderBy: { fecha: 'desc' },
      include: {
        clienta: true,
        vendedor: true,
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
      destino: `${v.destino || ''} ${v.provinciaDestino ? `- ${v.provinciaDestino}` : ''} ${v.municipioDestino ? `- ${v.municipioDestino}` : ''}`.trim() || 'No especificado',
      provinciaDestino: v.provinciaDestino || '',
      municipioDestino: v.municipioDestino || '',
      depositanteNombres: v.depositanteNombres || '',
      depositanteApPaterno: v.depositanteApPaterno || '',
      depositanteApMaterno: v.depositanteApMaterno || '',
      depositanteCuenta: v.depositanteCuenta || '',
      receptorDiferente: v.receptorDiferente || false,
      receptorNombres: v.receptorNombres || '',
      receptorApPaterno: v.receptorApPaterno || '',
      receptorApMaterno: v.receptorApMaterno || '',
      receptorCi: v.receptorCi || '',
      receptorCelular: v.receptorCelular || '',
      empresaBusesPreferida: v.empresaBusesPreferida || '',
      guiaEnvioUrl: v.guiaEnvioUrl || null,
      total: v.total,
      estado: v.estado === 'PENDIENTE_VERIFICACION' ? 'Pendiente' : 
              v.estado === 'ESPERANDO_PAGO' ? 'Esperando Pago' :
              v.estado === 'CANCELADO_POR_TIEMPO' ? 'Expirado' :
              v.estado === 'RECHAZADO' ? 'Rechazado' : 
              v.estado === 'PREPARANDO' ? 'PREPARANDO' :
              v.estado === 'ENTREGADO' ? 'ENTREGADO' : 'Aprobado',
      fecha: v.fecha.toLocaleString(),
      fechaRaw: v.fecha.toISOString(),
      terminosAceptados: v.terminosAceptados,
      fechaAceptacion: v.fechaAceptacion ? v.fechaAceptacion.toLocaleString() : null,
      ipAceptacion: v.ipAceptacion,
      comprobanteUrl: v.comprobante || "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?auto=format&fit=crop&w=400&q=80",
      puntosClienta: v.clienta?.puntos || 0,
      origen: v.origen,
      tipoEntrega: v.tipoEntrega,
      registradoPor: v.vendedor ? `${v.vendedor.nombres} ${v.vendedor.apellidos}`.trim() : (v.origen === "WEB" ? "Sistema Web" : "Caja"),
      articulos: v.items.map(item => ({
        id: item.id,
        nombre: item.prenda.nombre,
        imagen: item.prenda.imagenes && item.prenda.imagenes.length > 0 ? item.prenda.imagenes[0] : null,
        cantidad: item.cantidad,
        talla: item.talla || "N/A",
        color: item.color || "N/A",
        empaquetado: item.empaquetado
      }))
    }));

    revalidatePath('/', 'layout');
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
    revalidatePath('/', 'layout');
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
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function subirGuiaEnvio(ventaId: string, guiaUrl: string) {
  try {
    await prisma.venta.update({
      where: { id: ventaId },
      data: { guiaEnvioUrl: guiaUrl, estado: "ENTREGADO" }
    });
    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
