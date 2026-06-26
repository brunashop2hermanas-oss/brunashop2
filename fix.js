const fs = require('fs');
const filePath = 'src/app/admin/productos/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');
content = content.replace(/\r\n/g, '\n');

const target1 = `    let stockPorTallaLimpio: any = {};
    if (tallasSeleccionadas.length > 0 && Object.keys(formData.stockPorTalla).length > 0) {`;

const replacement1 = `    let stockPorTallaLimpio: any = {};
    if (tallasSeleccionadas.length > 0) {`;

if (content.includes(target1)) {
    content = content.replace(target1, replacement1);
    console.log('Target 1 matched and replaced');
} else {
    console.log('Target 1 not found');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done!');
