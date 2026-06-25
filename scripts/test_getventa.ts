import { getVenta, getVentas } from "../src/app/actions/ventas";
import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  const venta = await prisma.venta.findFirst({
    where: { terminosAceptados: true }
  });
  if (venta) {
    console.log("Testing with ID:", venta.id);
    const result = await getVenta(venta.id);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("No venta found with terminosAceptados = true");
  }
}

test();
