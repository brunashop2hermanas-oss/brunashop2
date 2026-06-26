"use server";
import { revalidatePath } from "next/cache";

import prisma from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";

export async function getDashboardStats(rangoMas: string = "Mes", rangoMenos: string = "Mes") {
  noStore();
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Configuracion Financiera
    const config = await prisma.configuracion.findFirst();
    const usarControlFinanciero = config?.usarControlFinanciero ?? true;

    // 1. Ventas de Hoy
    const ventasHoy = await prisma.venta.findMany({
      where: {
        fecha: { gte: hoy },
        estado: { in: ['PREPARANDO', 'ENTREGADO'] }
      },
    });

    const ingresosHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    const pedidosHoy = ventasHoy.length;

    const ventasMes = await prisma.venta.findMany({
      where: { 
        fecha: { gte: new Date(hoy.getFullYear(), hoy.getMonth(), 1) },
        estado: { in: ['PREPARANDO', 'ENTREGADO'] }
      }
    });
    const ingresosMes = ventasMes.reduce((sum, v) => sum + v.total, 0);

    const ventasAno = await prisma.venta.findMany({
      where: { 
        fecha: { gte: new Date(hoy.getFullYear(), 0, 1) },
        estado: { in: ['PREPARANDO', 'ENTREGADO'] }
      }
    });
    const ingresosAno = ventasAno.reduce((sum, v) => sum + v.total, 0);

    // Helper para obtener fecha de inicio según rango
    const getFechaInicio = (rango: string) => {
      if (rango === "Hoy") return new Date(hoy);
      if (rango === "Semana") {
        const dia = hoy.getDay();
        const diff = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
        const f = new Date(hoy);
        f.setDate(diff);
        return f;
      }
      if (rango === "Mes") return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      if (rango === "Año") return new Date(hoy.getFullYear(), 0, 1);
      return new Date(0); // Todo
    };

    const fechaInicioMas = getFechaInicio(rangoMas);
    const fechaInicioMenos = getFechaInicio(rangoMenos);

    // Traemos TODAS las prendas
    const todasLasPrendas = await prisma.prenda.findMany({
      select: { id: true, nombre: true, stockCount: true }
    });

    // MAS VENDIDOS
    const itemsVendidosMas = await prisma.ventaItem.findMany({
      where: {
        venta: { fecha: { gte: fechaInicioMas }, estado: { in: ['PREPARANDO', 'ENTREGADO'] } }
      }
    });
    const conteoPrendasMas: Record<string, number> = {};
    for (const p of todasLasPrendas) conteoPrendasMas[p.id] = 0;
    for (const item of itemsVendidosMas) {
      if (conteoPrendasMas[item.prendaId] !== undefined) conteoPrendasMas[item.prendaId] += item.cantidad;
    }
    const arrayVentasMas = todasLasPrendas.map(p => ({
      id: p.id, nombre: p.nombre, stock: p.stockCount, vendidos: conteoPrendasMas[p.id] || 0
    }));
    arrayVentasMas.sort((a, b) => b.vendidos - a.vendidos);
    const masVendidosList = arrayVentasMas.slice(0, 5);
    let masVendidoStr = masVendidosList[0]?.vendidos > 0 ? masVendidosList[0].nombre : "Aún no hay ventas";

    // MENOS VENDIDOS
    const itemsVendidosMenos = await prisma.ventaItem.findMany({
      where: {
        venta: { fecha: { gte: fechaInicioMenos }, estado: { in: ['PREPARANDO', 'ENTREGADO'] } }
      }
    });
    const conteoPrendasMenos: Record<string, number> = {};
    for (const p of todasLasPrendas) conteoPrendasMenos[p.id] = 0;
    for (const item of itemsVendidosMenos) {
      if (conteoPrendasMenos[item.prendaId] !== undefined) conteoPrendasMenos[item.prendaId] += item.cantidad;
    }
    const arrayVentasMenos = todasLasPrendas.map(p => ({
      id: p.id, nombre: p.nombre, stock: p.stockCount, vendidos: conteoPrendasMenos[p.id] || 0
    }));
    const prendasConStockMenos = arrayVentasMenos.filter(p => p.stock > 0);
    prendasConStockMenos.sort((a, b) => a.vendidos - b.vendidos);
    const menosVendidosList = prendasConStockMenos.slice(0, 5);

    // 3. Clientas Totales
    const clientasTotales = await prisma.clienta.count();

    // 4. Alertas de Inventario Bajo
    const prendasAgotandose = await prisma.prenda.findMany({
      where: {
        estado: { not: "AGOTADO" }
      }
    });

    const alertasInventario = prendasAgotandose
      .map(p => {
        let stockGlobal = p.stockCount;
        let tallasBajas = [];
        if (p.stockPorTalla && typeof p.stockPorTalla === 'object') {
           const obj = p.stockPorTalla as Record<string, string>;
           for (const [talla, qty] of Object.entries(obj)) {
             if (parseInt(qty) <= 2) {
               tallasBajas.push(`${talla} (${qty})`);
             }
           }
        }
        return {
          id: p.id,
          nombre: p.nombre,
          stock: p.stockCount,
          tallasBajas: tallasBajas
        };
      })
      .filter(p => p.stock <= 3 || p.tallasBajas.length > 0)
      .slice(0, 5);

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: {
        ingresosHoy,
        ingresosMes,
        ingresosAno,
        pedidosHoy,
        masVendido: masVendidoStr,
        masVendidosList,
        menosVendidosList,
        clientasTotales,
        usarControlFinanciero,
        alertasInventario
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
    let fechaFin = new Date();
    let isRangoCerrado = false;

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
    } else if (rango.startsWith("fecha:")) {
      const dateStr = rango.split(":")[1];
      const [year, month, day] = dateStr.split("-").map(Number);
      fechaInicio = new Date(year, month - 1, day, 0, 0, 0);
      fechaFin = new Date(year, month - 1, day, 23, 59, 59);
      isRangoCerrado = true;
    }

    const config = await prisma.configuracion.findFirst();
    const usarControlFinanciero = config?.usarControlFinanciero ?? true;

    const dateQuery: any = { gte: fechaInicio };
    if (isRangoCerrado) {
      dateQuery.lte = fechaFin;
    }

    // Traer las ventas del rango
    const ventas = await prisma.venta.findMany({
      where: {
        fecha: dateQuery,
        estado: { in: ['PREPARANDO', 'ENTREGADO'] }
      },
      include: {
        clienta: true,
        vendedor: true,
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

      // Calcular ciudad (Ignorando las ventas en Tienda Física)
      if (venta.destino !== "Tienda Física" && venta.tipoEntrega !== "TIENDA" && venta.tipoEntrega !== "RECOJO_TIENDA") {
        const ciudad = venta.destino || "No especificada";
        ciudades[ciudad] = (ciudades[ciudad] || 0) + 1;
      }

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

            let responsableTexto = "Sistema Web";
            if (venta.origen !== "WEB") {
              if (venta.vendedor) {
                const rolStr = (venta.vendedor.role === 'ADMINISTRADOR' || venta.vendedor.role === 'ADMIN') ? 'Admin' : 'Empleada';
                responsableTexto = `${rolStr}: ${venta.vendedor.nombres} ${venta.vendedor.apellidos}`.trim();
              } else {
                responsableTexto = "Admin Principal (Caja)";
              }
            }

            // Añadir a transacciones
            transaccionesDetalladas.push({
              id: item.id,
              ventaId: venta.id,
              prendaNombre: item.prenda.nombre,
              cantidad: item.cantidad,
              talla: item.talla || "Unico",
              color: item.color || "Unico",
              monto: item.precio * item.cantidad,
              clientaNombre: venta.clienta ? `${venta.clienta.nombres} ${venta.clienta.apellidos}`.trim() : "Cliente General",
              clientaDatos: venta.clienta ? `CI: ${venta.clienta.ci} - Cel: ${venta.clienta.celular}` : "Sin datos",
              responsable: responsableTexto,
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

    revalidatePath('/', 'layout');
    return {
      success: true,
      data: {
        ingresosBrutos,
        gananciaNeta,
        prendasVendidas,
        mejorDia,
        categorias: categoriasPorcentaje,
        ciudades: ciudadesOrdenadas,
        transacciones: transaccionesDetalladas,
        usarControlFinanciero
      }
    };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
