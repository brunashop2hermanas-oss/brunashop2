import { NextResponse } from "next/server";
import { buscarClientaPorCI, crearReservaAnonima, vincularClientaReserva, cancelarVentaExpirada } from "@/app/actions/ventas";
import prisma from "@/lib/prisma";

export async function GET() {
  const logs: string[] = [];
  const log = (msg: string) => logs.push(`[${new Date().toISOString()}] ${msg}`);

  try {
    log("=== INICIANDO AUDITORÍA Y SIMULACROS DE BRUNASHOP2 ===");
    
    // 1. Limpieza inicial para la prueba (opcional, o crear datos únicos)
    const testCi = "9999999TEST";
    const testUsername = "test_auditoria_" + Date.now();
    
    // 2. Crear una prenda de prueba
    log("1. Creando prenda de prueba (Inventario)");
    const prenda = await prisma.prenda.create({
      data: {
        nombre: "Vestido de Prueba Auditoría",
        costoProveedor: 50,
        precioVenta: 150,
        categoria: "Vestidos",
        tallas: ["S", "M"],
        colores: ["Rojo", "Negro"],
        stockCount: 10,
        estado: "DISPONIBLE",
        stockPorTalla: {
          "S": { "Rojo": "3", "Negro": "2" },
          "M": { "Rojo": "2", "Negro": "3" }
        }
      }
    });
    log(`Prenda creada: ${prenda.id} con stock: ${prenda.stockCount}`);

    // 3. Simular Reserva Anónima Web
    log("2. Simulando Reserva Anónima Web");
    const reserva = await crearReservaAnonima({
      total: 150,
      items: [{
        prendaId: prenda.id,
        cantidad: 1,
        precioUnitario: 150,
        talla: "S",
        color: "Rojo"
      }]
    });
    
    if (!reserva.success) {
      log(`ERROR en Reserva Anónima: ${reserva.error}`);
    } else {
      const ventaId = (reserva.data as any).id;
      log(`Reserva creada con ID: ${ventaId}`);
      
      // Verificar deducción de stock
      const prendaActualizada = await prisma.prenda.findUnique({ where: { id: prenda.id } });
      log(`Stock general actualizado a: ${prendaActualizada?.stockCount} (esperado: 9)`);
      const stockJSON = prendaActualizada?.stockPorTalla as any;
      log(`Stock específico actualizado S/Rojo a: ${stockJSON?.["S"]?.["Rojo"]} (esperado: 2)`);

      // 4. Simular Vinculación de Clienta (Formulario checkout)
      log("3. Simulando registro y vinculación de clienta");
      const vinculacion = await vincularClientaReserva(ventaId, {
        ci: testCi,
        nombres: "Clienta",
        apellidoPaterno: "Prueba",
        celular: "77777777",
        ciudadDestino: "Santa Cruz",
        tiempoReservaMinutos: 10
      });
      
      if (!vinculacion.success) log(`ERROR vinculando clienta: ${vinculacion.error}`);
      else log(`Clienta vinculada exitosamente a la reserva.`);

      // 5. Simular expiración de venta (Caducidad)
      log("4. Simulando Expiración por falta de pago");
      const expiracion = await cancelarVentaExpirada(ventaId);
      if (!expiracion.success) log(`ERROR expirando venta: ${expiracion.error}`);
      else {
        log(`Venta cancelada exitosamente.`);
        const prendaRestaurada = await prisma.prenda.findUnique({ where: { id: prenda.id } });
        log(`Stock general restaurado a: ${prendaRestaurada?.stockCount} (esperado: 10)`);
      }
    }

    // 6. Eliminar datos de prueba para no ensuciar la BD
    log("5. Limpiando datos de prueba...");
    await prisma.ventaItem.deleteMany({ where: { prendaId: prenda.id } });
    await prisma.venta.deleteMany({ where: { clienta: { ci: testCi } } });
    await prisma.clienta.deleteMany({ where: { ci: testCi } });
    await prisma.prenda.delete({ where: { id: prenda.id } });
    log("Limpieza completada.");
    
    log("=== AUDITORÍA FINALIZADA CORRECTAMENTE ===");

    return NextResponse.json({ success: true, logs });

  } catch (error: any) {
    log(`ERROR FATAL: ${error.message}`);
    return NextResponse.json({ success: false, logs });
  }
}
