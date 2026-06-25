const fs = require('fs');

// 1. Fix admin/pedidos/page.tsx badge colors
let pedidosCode = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

// Also replace the desktop table version which might have borders
pedidosCode = pedidosCode.replace(/pedido\.estado === 'Aprobado' \? 'bg-green-500\/20 text-green-500/g, "(pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO') ? 'bg-green-500/20 text-green-600");

fs.writeFileSync('src/app/admin/pedidos/page.tsx', pedidosCode);
console.log('Fixed pedidos/page.tsx badges');

// 2. Fix actions/ventas.ts subirGuiaEnvio state
let ventasCode = fs.readFileSync('src/app/actions/ventas.ts', 'utf8');

if (ventasCode.includes('data: { guiaEnvioUrl: guiaUrl }')) {
  ventasCode = ventasCode.replace('data: { guiaEnvioUrl: guiaUrl }', 'data: { guiaEnvioUrl: guiaUrl, estado: "ENTREGADO" }');
}

fs.writeFileSync('src/app/actions/ventas.ts', ventasCode);
console.log('Fixed actions/ventas.ts');
