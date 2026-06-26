const fs = require('fs');

function patchVentas() {
  const filePath = 'src/app/actions/ventas.ts';
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/\r\n/g, '\n');

  const target = `        if (typeof stockObj[talla] === 'object' && color) {
          const currentStock = parseInt(stockObj[talla][color] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla][color] = newStock.toString();
        } else {
          const currentStock = parseInt(stockObj[talla] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla] = newStock.toString();
        }`;

  const replacement = `        if (typeof stockObj[talla] === 'object') {
          const colorKey = color || 'Unico';
          const currentStock = parseInt(stockObj[talla][colorKey] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla][colorKey] = newStock.toString();
        } else {
          const currentStock = parseInt(stockObj[talla] || "0");
          const newStock = operacion === 'decrement' ? Math.max(0, currentStock - cantidad) : currentStock + cantidad;
          stockObj[talla] = newStock.toString();
        }`;

  if (content.includes(target)) {
      content = content.replace(target, replacement);
      console.log('ventas.ts Target matched and replaced');
  } else {
      console.log('ventas.ts Target not found');
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

patchVentas();
console.log('Done!');
