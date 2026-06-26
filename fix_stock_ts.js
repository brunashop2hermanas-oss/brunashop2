const fs = require('fs');
let content = fs.readFileSync('src/app/admin/productos/page.tsx', 'utf8');

const targetOld = `    // Calcular el stock total basado en la matriz (si no es conjunto) o en la cantidad directa
    let stockTotal = 0;
    let coloresLimpios = formData.colores.split(",").map(c => c.trim()).filter(c => c);

    let stockPorTallaLimpio: any = {};
    if (formData.isConjunto) {
      stockTotal = Number(formData.stockCount) || 0;
    } else if (tallasSeleccionadas.length > 0 && Object.keys(formData.stockPorTalla).length > 0) {
      for (const talla of tallasSeleccionadas) {
        if (typeof formData.stockPorTalla[talla] === 'object') {
          stockPorTallaLimpio[talla] = {};
          for (const color in formData.stockPorTalla[talla]) {
            // Solo contar 'Unico' si no hay colores especificados. Si hay colores, ignorar 'Unico'.
            if ((coloresLimpios.length === 0 && color === 'Unico') || coloresLimpios.includes(color)) {
              stockTotal += Number(formData.stockPorTalla[talla][color]) || 0;
              stockPorTallaLimpio[talla][color] = formData.stockPorTalla[talla][color];
            }
          }
        }
      }
    } else {
      stockTotal = Number(formData.stockCount) || 0;
    }`;

const targetNew = `    // Calcular el stock total basado en la matriz (si no es conjunto) o en la cantidad directa
    let stockTotal = 0;
    let coloresLimpios = formData.colores.split(",").map(c => c.trim()).filter(c => c);

    let stockPorTallaLimpio: any = {};
    if (tallasSeleccionadas.length > 0 && Object.keys(formData.stockPorTalla).length > 0) {
      for (const talla of tallasSeleccionadas) {
        if (typeof formData.stockPorTalla[talla] === 'object') {
          stockPorTallaLimpio[talla] = {};
          for (const color in formData.stockPorTalla[talla]) {
            if ((coloresLimpios.length === 0 && color === 'Unico') || coloresLimpios.includes(color)) {
              stockTotal += Number(formData.stockPorTalla[talla][color]) || 0;
              stockPorTallaLimpio[talla][color] = formData.stockPorTalla[talla][color];
            }
          }
        }
      }
      if (formData.isConjunto) {
        stockTotal = Number(formData.stockCount) || 0; // Si es conjunto, respetamos el stock general aunque haya matriz de tallas
      }
    } else {
      stockTotal = Number(formData.stockCount) || 0;
    }`;

content = content.replace(targetOld, targetNew);

fs.writeFileSync('src/app/admin/productos/page.tsx', content);
console.log("Fixed!");
