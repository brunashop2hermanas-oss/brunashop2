const fs = require('fs');
let code = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');
const lines = code.split('\n');
for (let i = 560; i < 795; i++) {
  if (lines[i]) {
    lines[i] = lines[i].replace(/className=\"p-4/g, 'className=\"px-2 py-3');
  }
}
fs.writeFileSync('src/app/admin/pedidos/page.tsx', lines.join('\n'));
console.log('Done!');
