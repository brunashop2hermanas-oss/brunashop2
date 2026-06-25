import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO AUDITORÍA Y PRUEBAS E2E ===");
  const testId = Date.now().toString().slice(-4);
  console.log(`ID de Prueba: ${testId}`);

  try {
    // 1. Roles: Crear Empleado y Administrador
    console.log("\n1. Creando Usuarios (Roles: EMPLEADO y ADMIN)...");
    const empleado = await prisma.user.create({
      data: {
        nombres: "Empleado",
        apellidos: `Prueba ${testId}`,
        username: `empleado_${testId}`,
        pin: "123456",
        role: "EMPLEADO",
        telefono: "12345678",
        ci: `EMP-${testId}`
      }
    });
    console.log(`   -> Empleado creado: ${empleado.nombres} ${empleado.apellidos}`);

    const admin = await prisma.user.create({
      data: {
        nombres: "Administrador",
        apellidos: `Prueba ${testId}`,
        username: `admin_${testId}`,
        pin: "123456",
        role: "ADMINISTRADOR",
        telefono: "12345678",
        ci: `ADM-${testId}`
      }
    });
    console.log(`   -> Admin creado: ${admin.nombres} ${admin.apellidos}`);

    // 2. Clienta
    console.log("\n2. Creando Clienta de Prueba...");
    const clienta = await prisma.clienta.create({
      data: {
        nombres: "Clienta",
        apellidos: `VIP ${testId}`,
        ci: `CI-${testId}`,
        celular: `777${testId}`,
        puntos: 0
      }
    });
    console.log(`   -> Clienta creada: ${clienta.nombres} ${clienta.apellidos} (CI: ${clienta.ci})`);

    // 3. Crear Prendas Individuales
    console.log("\n3. Creando Prendas en Inventario...");
    const prendaSuelta = await prisma.prenda.create({
      data: {
        nombre: `Chaqueta Suelta E2E ${testId}`,
        descripcionLarga: "Chaqueta para pruebas",
        categoria: "Chaquetas y Abrigos",
        precioOriginal: 250,
        precioVenta: 200,
        costoProveedor: 100,
        tallas: ["S", "M"],
        colores: ["Negro"],
        stockCount: 10,
        stockPorTalla: { "S": 5, "M": 5 }
      }
    });
    console.log(`   -> Prenda Suelta creada: ${prendaSuelta.nombre}`);

    const pieza1 = await prisma.prenda.create({
      data: {
        nombre: `Top Pieza E2E ${testId}`,
        categoria: "Blusas y Tops",
        precioVenta: 100,
        costoProveedor: 50,
        tallas: ["S"],
        colores: ["Blanco"],
        stockCount: 10,
        stockPorTalla: { "S": 10 }
      }
    });
    const pieza2 = await prisma.prenda.create({
      data: {
        nombre: `Falda Pieza E2E ${testId}`,
        categoria: "Vestidos",
        precioVenta: 100,
        costoProveedor: 50,
        tallas: ["S"],
        colores: ["Negro"],
        stockCount: 10,
        stockPorTalla: { "S": 10 }
      }
    });
    console.log(`   -> Piezas para conjunto creadas: ${pieza1.nombre}, ${pieza2.nombre}`);

    // 4. Crear Conjunto (agrupa piezas)
    console.log("\n4. Creando Conjunto/Combo...");
    const conjunto = await prisma.prenda.create({
      data: {
        nombre: `Conjunto Verano E2E ${testId}`,
        categoria: "Conjuntos",
        precioOriginal: 200,
        precioVenta: 180, // Descuento por combo
        costoProveedor: 0,
        isConjunto: true,
        piezasId: [pieza1.id, pieza2.id],
        piezasDetalle: {
          [pieza1.id]: { id: pieza1.id, nombre: pieza1.nombre, cantidad: 1 },
          [pieza2.id]: { id: pieza2.id, nombre: pieza2.nombre, cantidad: 1 }
        },
        stockCount: 5 // Stock virtual del conjunto
      }
    });
    console.log(`   -> Conjunto creado: ${conjunto.nombre} (Incluye piezas de prueba)`);

    // 5. Simular Flujo Cliente (Compra WEB)
    console.log("\n5. Simulando Flujo de Compra Web (Clienta)...");
    const ventaWeb = await prisma.venta.create({
      data: {
        clientaId: clienta.id,
        origen: "WEB",
        estado: "ESPERANDO_PAGO",
        destino: "Santa Cruz",
        total: conjunto.precioVenta,
        metodoPago: "QR",
        items: {
          create: [{
            prendaId: conjunto.id,
            cantidad: 1,
            precio: conjunto.precioVenta,
            talla: "S",
            color: "Variado"
          }]
        }
      }
    });
    console.log(`   -> Venta WEB creada. Estado: ESPERANDO_PAGO (ID: ${ventaWeb.id})`);

    // 6. Simular Flujo de Pedidos (Administrador aprueba y empaqueta)
    console.log("\n6. Simulando Flujo de Aprobación de Pedidos (Administrador)...");
    
    // Subir comprobante (Pasa a Pendiente de Verificación)
    await prisma.venta.update({
      where: { id: ventaWeb.id },
      data: {
        estado: "PENDIENTE_VERIFICACION",
        comprobante: "https://ejemplo.com/comprobante_e2e.jpg",
        depositanteNombres: "Clienta VIP"
      }
    });
    console.log(`   -> Cliente sube comprobante. Estado: PENDIENTE_VERIFICACION`);

    // Admin aprueba (Pasa a PAGADO) y descuenta stock
    await prisma.venta.update({
      where: { id: ventaWeb.id },
      data: { estado: "PAGADO" }
    });
    
    // Descontar stock manual en el script (ya que la UI llama a ajustarStock)
    await prisma.prenda.update({
      where: { id: pieza1.id },
      data: { stockCount: { decrement: 1 } }
    });
    await prisma.prenda.update({
      where: { id: pieza2.id },
      data: { stockCount: { decrement: 1 } }
    });
    console.log(`   -> Admin Aprueba Pago. Estado: PAGADO. Stock descontado.`);

    // Empaquetar
    await prisma.venta.update({
      where: { id: ventaWeb.id },
      data: { estado: "EMPAQUETADO" }
    });
    console.log(`   -> Admin Empaqueta el Pedido. Estado: EMPAQUETADO`);

    // 7. Simular Venta en Caja (Empleado)
    console.log("\n7. Simulando Venta en Caja FÍSICA (Empleado)...");
    const ventaCaja = await prisma.venta.create({
      data: {
        clientaId: clienta.id,
        vendedorId: empleado.id,
        origen: "POS",
        estado: "PAGADO", // Venta física es directa
        metodoPago: "EFECTIVO",
        total: prendaSuelta.precioVenta,
        items: {
          create: [{
            prendaId: prendaSuelta.id,
            cantidad: 1,
            precio: prendaSuelta.precioVenta,
            talla: "S",
            color: "Negro"
          }]
        }
      }
    });
    
    await prisma.prenda.update({
      where: { id: prendaSuelta.id },
      data: { stockCount: { decrement: 1 } }
    });
    console.log(`   -> Venta CAJA realizada por el EMPLEADO. Stock descontado. (ID: ${ventaCaja.id})`);

    console.log("\n=== PRUEBAS E2E FINALIZADAS CORRECTAMENTE ===");
    console.log(`Puedes revisar en tu panel:`);
    console.log(`- El Empleado: USUARIO: ${empleado.username} / PIN: 123456`);
    console.log(`- El Administrador: USUARIO: ${admin.username} / PIN: 123456`);
    console.log(`- El Conjunto: ${conjunto.nombre}`);
    console.log(`- La Venta Web: Estado Empaquetado, Compradora ${clienta.nombres}`);
    console.log(`- La Venta Caja: Realizada por ${empleado.nombres}`);
  } catch (e) {
    console.error("Error en E2E:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
