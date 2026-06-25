const fs = require('fs');

let pedidosCode = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

const targetString = `<div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border mt-1">`;
const replacement = `<div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border mt-1">
                  {(() => {
                    if (pedido.estado !== 'Aprobado' && pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PREPARANDO' && pedido.estado !== 'ENVIADO') {
                      return null;
                    }
                    return (
                      <button 
                        onClick={() => {
                          if (!esTiendaDirecta) setPedidoEmpaquetando(pedido);
                        }}
                        className={\`w-full px-3 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md \${
                          esTiendaDirecta 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 cursor-default'
                          : todasEmpaquetadas 
                          ? 'bg-green-500/20 text-green-700 border border-green-500/50 hover:bg-green-500 hover:text-white'
                          : 'bg-orange-500 text-white border-orange-500/30 hover:bg-orange-600'
                        }\`}
                      >
                        {esTiendaDirecta ? (
                          <><CheckCircle className="w-4 h-4" /> Entregado en Tienda</>
                        ) : todasEmpaquetadas ? (
                          <><CheckCircle className="w-4 h-4" /> Listo (Ver Paquete)</>
                        ) : (
                          <><PackageCheck className="w-4 h-4" /> Empaquetar (\${arts.filter((a:any) => a.empaquetado).length}/\${arts.length})</>
                        )}
                      </button>
                    );
                  })()}
`;

if (!pedidosCode.includes('Empaquetar (${arts.filter')) {
  // Only replace the first occurrence after the lg:hidden
  const mobileStart = pedidosCode.indexOf('lg:hidden');
  const targetPos = pedidosCode.indexOf(targetString, mobileStart);
  
  pedidosCode = pedidosCode.substring(0, targetPos) + replacement + pedidosCode.substring(targetPos + targetString.length);
  fs.writeFileSync('src/app/admin/pedidos/page.tsx', pedidosCode);
  console.log('Added empaquetar button to mobile view.');
} else {
  console.log('Button already exists.');
}
