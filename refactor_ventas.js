const fs = require('fs');

const path = 'c:\\\\Users\\\\abrah\\\\Desktop\\\\sistema_BrunaShop2\\\\src\\\\app\\\\actions\\\\ventas.ts';
let code = fs.readFileSync(path, 'utf8');

const helperCode = `
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
`;

// Insert helper after imports
code = code.replace('import { revalidatePath, unstable_noStore as noStore } from "next/cache";', 'import { revalidatePath, unstable_noStore as noStore } from "next/cache";\n' + helperCode);

// Replace in crearReservaAnonima
// Find the `// Descontar Stock para reservar` block
const startReserva = code.indexOf('// Descontar Stock para reservar');
const endReserva = code.indexOf('return venta;', startReserva);
if (startReserva > -1 && endReserva > -1) {
    const newReservaBlock = `// Descontar Stock para reservar
      for (const item of data.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'decrement', item.talla, item.color);
      }
      `;
    code = code.substring(0, startReserva) + newReservaBlock + code.substring(endReserva);
}

// Replace in cancelarVentaExpirada
const startCancela = code.indexOf('// 1. Restaurar stock');
const endCancela = code.indexOf('// 2. Marcar Venta como CANCELADO_POR_TIEMPO', startCancela);
if (startCancela > -1 && endCancela > -1) {
    const newCancelaBlock = `// 1. Restaurar stock
      for (const item of venta.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'increment', item.talla, item.color);
      }

      `;
    code = code.substring(0, startCancela) + newCancelaBlock + code.substring(endCancela);
}

// Replace in createVenta
const startCreateVenta = code.indexOf('// 3. Descontar Stock de las Prendas');
const endCreateVenta = code.indexOf('return venta;', startCreateVenta);
if (startCreateVenta > -1 && endCreateVenta > -1) {
    const newCreateBlock = `// 3. Descontar Stock de las Prendas
      for (const item of data.items) {
        await ajustarStock(tx, item.prendaId, item.cantidad, 'decrement', item.talla, item.color);
      }

      `;
    code = code.substring(0, startCreateVenta) + newCreateBlock + code.substring(endCreateVenta);
}

fs.writeFileSync(path, code);
console.log('Refactor completed.');
