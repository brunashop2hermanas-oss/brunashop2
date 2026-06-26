const fs = require('fs');
let content = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf-8');
content = content.replace(/<td className="p-4 flex justify-center gap-2">/g, '<td className="p-4 flex flex-wrap justify-center gap-2">');
fs.writeFileSync('src/app/admin/pedidos/page.tsx', content);
console.log('Fixed wrapper');
