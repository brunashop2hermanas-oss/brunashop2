"use server";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getDashboardStats() {
  noStore();
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 1. Ventas de Hoy
    const ventasHoy = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: hoy,
        },
      },
    });

    const ingresosHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const pedidosHoy = ventasHoy.length;

    // 2. Más Vendido (Mes actual)
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Traemos los items vendidos este mes para calcular el más vendido
    const itemsVendidos = await prisma.ventaItem.findMany({
      where: {
        venta: {
          fecha: {
            gte: primerDiaMes
          }
        }
      },
      include: {
        prenda: true
      }
    });

    const conteoPrendas: Record<string, { nombre: string, cantidad: number }> = {};
    for (const item of itemsVendidos) {
      if (!item.prenda) continue;
      if (!conteoPrendas[item.prendaId]) {
        conteoPrendas[item.prendaId] = { nombre: item.prenda.nombre, cantidad: 0 };
      }
      conteoPrendas[item.prendaId].cantidad += item.cantidad;
    }

    let masVendido = "Aún no hay ventas";
    let maxVentas = 0;
    for (const id in conteoPrendas) {
      if (conteoPrendas[id].cantidad > maxVentas) {
        maxVentas = conteoPrendas[id].cantidad;
        masVendido = conteoPrendas[id].nombre;
      }
    }

    // 3. Clientas Totales (Usado en lugar de Visitas Web)
    const clientasTotales = await prisma.clienta.count();

    return {
      success: true,
      data: {
        ingresosHoy,
        pedidosHoy,
        masVendido,
        clientasTotales
      }
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getReportesFinancieros(rango: string) {
  noStore();
  try {
    const ahora = new Date();
    let fechaInicio = new Date();

    if (rango === "Diario") {
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (rango === "Semanal") {
      const dia = fechaInicio.getDay();
      const diff = fechaInicio.getDate() - dia + (dia === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
      fechaInicio.setDate(diff);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (rango === "Mensual") {
      fechaInicio.setDate(1);
      fechaInicio.setHours(0, 0, 0, 0);
    } else if (rango === "Anual") {
      fechaInicio.setMonth(0, 1);
      fechaInicio.setHours(0, 0, 0, 0);
    }

    // Traer las ventas del rango
    const ventas = await prisma.venta.findMany({
      where: {
        fecha: {
          gte: fechaInicio,
        },
      },
      include: {
        clienta: true,
        items: {
          include: {
            prenda: true
          }
        }
      },
      orderBy: { fecha: 'desc' }
    });

    let ingresosBrutos = 0;
    let prendasVendidas = 0;
    let costoTotalProveedores = 0;
    const ventasPorDia: Record<string, number> = {};
    const categorias: Record<string, number> = {};
    const ciudades: Record<string, number> = {};

    const transaccionesDetalladas = [];

    for (const venta of ventas) {
      ingresosBrutos += venta.total;

      // Calcular ciudad
      const ciudad = venta.destino || "No especificada";
      ciudades[ciudad] = (ciudades[ciudad] || 0) + 1;

      // Calcular mejor día
      const nombreDia = venta.fecha.toLocaleDateString('es-ES', { weekday: 'long' });
      ventasPorDia[nombreDia] = (ventasPorDia[nombreDia] || 0) + venta.total;

      for (const item of venta.items) {
        prendasVendidas += item.cantidad;
        if (item.prenda) {
          costoTotalProveedores += (item.prenda.costoProveedor * item.cantidad);
          
          // Categorías
          const cat = item.prenda.categoria || "Otros";
          categorias[cat] = (categorias[cat] || 0) + item.cantidad;

          // Añadir a transacciones
          transaccionesDetalladas.push({
            id: item.id,
            prendaNombre: item.prenda.nombre,
            cantidad: item.cantidad,
            monto: item.precio * item.cantidad,
            clientaNombre: venta.clienta ? `${venta.clienta.nombres} ${venta.clienta.apellidos}`.trim() : "Cliente General",
            clientaDatos: venta.clienta ? `CI: ${venta.clienta.ci} - Cel: ${venta.clienta.celular}` : "Sin datos",
            responsable: venta.origen === "WEB" ? "Sistema Web" : "Cajera",
            fecha: venta.fecha.toLocaleString()
          });
        }
      }
    }

    const gananciaNeta = ingresosBrutos - costoTotalProveedores;

    // Obtener el mejor día
    let mejorDia = "Sin ventas";
    let maxVentasDia = 0;
    for (const dia in ventasPorDia) {
      if (ventasPorDia[dia] > maxVentasDia) {
        maxVentasDia = ventasPorDia[dia];
        mejorDia = dia.charAt(0).toUpperCase() + dia.slice(1);
      }
    }

    // Formatear Categorías a Porcentaje y ordenar
    const totalCategorias = Object.values(categorias).reduce((a, b) => a + b, 0);
    const categoriasPorcentaje = Object.entries(categorias)
      .map(([nombre, cantidad]) => ({
        nombre,
        porcentaje: totalCategorias > 0 ? Math.round((cantidad / totalCategorias) * 100) : 0
      }))
      .sort((a, b) => b.porcentaje - a.porcentaje);

    // Ordenar Ciudades
    const ciudadesOrdenadas = Object.entries(ciudades)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5); // Top 5

    return {
      success: true,
      data: {
        ingresosBrutos,
        gananciaNeta,
        prendasVendidas,
        mejorDia,
        categorias: categoriasPorcentaje,
        ciudades: ciudadesOrdenadas,
        transacciones: transaccionesDetalladas
      }
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
