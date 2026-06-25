const fs = require('fs');

// 1. Fix admin/pedidos/page.tsx
let pedidosCode = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

if (!pedidosCode.includes('entregarPedidoEnTienda')) {
  const insertPos = pedidosCode.indexOf('const imprimirVineta =');
  const entregarFunc = `
  const entregarPedidoEnTienda = async (pedido: any) => {
    const res = await updateEstadoVenta(pedido.id, 'ENTREGADO');
    if (res.success) {
      toast.success("¡Pedido entregado exitosamente en tienda!");
      cargarPedidos();
    } else {
      toast.error("Error al entregar: " + res.error);
    }
  };
  
`;
  pedidosCode = pedidosCode.slice(0, insertPos) + entregarFunc + pedidosCode.slice(insertPos);
}

// Extract the filter logic and replace map
// Let's replace the inline filter with a variable `pedidosFiltrados` before the main return
const returnIndex = pedidosCode.indexOf('  return (\n    <div className="flex-1 p-6 md:p-10 relative">');
if (returnIndex !== -1 && !pedidosCode.includes('const pedidosFiltrados =')) {
  const filterCode = `
  const pedidosFiltrados = pedidos.filter(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return false;

    const arts = pedido.articulos || [];
    const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
    
    const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
    const esAbandonado = pedido.estado === 'Esperando Pago' || pedido.estado === 'Expirado';

    const textoBusqueda = busqueda.toLowerCase();
    const coincideBusqueda = 
      (pedido.cliente && pedido.cliente.toLowerCase().includes(textoBusqueda)) || 
      (pedido.ci && pedido.ci.includes(textoBusqueda)) || 
      (pedido.id && pedido.id.toLowerCase().includes(textoBusqueda));

    if (busqueda && !coincideBusqueda) return false;

    if (filtroTab === 'pendientes') return !todasEmpaquetadas && !esAbandonado && !esTiendaDirecta && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'listos') return todasEmpaquetadas && !esAbandonado && !pedido.guiaEnvioUrl && !esTiendaDirecta && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'enviados') return (todasEmpaquetadas && !esAbandonado && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && !esAbandonado) || pedido.estado === 'ENTREGADO';
    
    return true;
  });

  const pedidosARenderizar = filtroTab === 'enviados' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados;

`;
  pedidosCode = pedidosCode.slice(0, returnIndex) + filterCode + pedidosCode.slice(returnIndex);
}

// Replace the table inline filter with mapping of `pedidosARenderizar`
const tableRenderStart = pedidosCode.indexOf('{pedidos.length === 0 ? (');
const tableRenderMap = pedidosCode.indexOf('}).map((pedido) => {');

if (tableRenderStart !== -1 && tableRenderMap !== -1 && !pedidosCode.includes('pedidosARenderizar.length === 0')) {
  // Replace the inline filter logic up to .map
  const replacement = `{pedidosARenderizar.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-foreground/50 font-medium">
                    No hay pedidos en esta sección.
                  </td>
                </tr>
              ) : pedidosARenderizar.map((pedido) => {
                const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
                const arts = pedido.articulos || [];`;
                
  pedidosCode = pedidosCode.substring(0, tableRenderStart) + replacement + pedidosCode.substring(tableRenderMap + '}).map((pedido) => {\n                const esTiendaDirecta = pedido.destino === \'Tienda Física\' || pedido.tipoEntrega === \'TIENDA\' || pedido.tipoEntrega === \'RECOJO_TIENDA\';\n                const arts = pedido.articulos || [];'.length);
}

// Add card view
const tableTag = '<table className="w-full text-left border-collapse">';
if (pedidosCode.includes(tableTag)) {
  pedidosCode = pedidosCode.replace(tableTag, '<table className="w-full text-left border-collapse hidden lg:table">');
}

// Add the cards under the table (closing div of overflow-x-auto)
const tableEnd = '          </table>\n        </div>';
if (pedidosCode.includes(tableEnd) && !pedidosCode.includes('lg:hidden')) {
  const cardView = `          </table>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {pedidosARenderizar.length === 0 ? (
            <div className="p-10 text-center text-foreground/50 font-medium bg-surface rounded-xl">No hay pedidos en esta sección.</div>
          ) : pedidosARenderizar.map((pedido) => {
            const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
            const arts = pedido.articulos || [];
            const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
            
            return (
              <div key={pedido.id} className="bg-surface border border-surface-border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                <div className="flex justify-between items-center border-b border-surface-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-primary">{pedido.id.slice(-6).toUpperCase()}</span>
                    <span className={\`text-[10px] px-2 py-0.5 rounded font-bold \${pedido.origen === 'WEB' ? 'bg-blue-500/20 text-blue-500' : 'bg-pink-500/20 text-pink-500'}\`}>{pedido.origen}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">Bs. {pedido.total.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{pedido.cliente}</div>
                  <div className="text-xs text-foreground/60">{pedido.destino} - {pedido.celular}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={\`px-2 py-1 rounded-full font-bold \${pedido.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-500' : pedido.estado === 'Aprobado' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}\`}>{pedido.estado}</span>
                  <span className="font-medium text-foreground/70">{arts.length} prendas</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border mt-1">
                  {pedido.estado === 'Pendiente' && (
                    <button onClick={() => setPedidoSeleccionado(pedido)} className="px-3 py-1.5 bg-brand-primary text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4"/> Verificar Pago
                    </button>
                  )}
                  {pedido.estado !== 'Rechazado' && !esTiendaDirecta && (
                    <button onClick={() => imprimirVineta(pedido)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4"/> Ticket Envío
                    </button>
                  )}
                  
                  {(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'listos')) && (
                    <div className="w-full flex gap-2">
                      <label className={\`flex-1 text-center px-3 py-1.5 rounded-lg shadow-md font-bold text-xs flex items-center justify-center cursor-pointer border \${pedido.guiaEnvioUrl ? 'bg-green-500/20 text-green-600 border-green-500/50' : 'bg-brand-primary text-white'}\`}>
                        {pedido.guiaEnvioUrl ? 'Ver Guía' : 'Subir Guía'}
                        <input type="file" className="hidden" accept="image/*" disabled={!todasEmpaquetadas || isUploadingGuia === pedido.id} onChange={(e) => handleSubirGuia(e, pedido)} />
                      </label>
                      {pedido.guiaEnvioUrl && (
                        <button onClick={() => enviarWhatsApp(pedido.celular, \`¡Hola \${pedido.cliente}! 😊 Tu pedido de BrunaShop (ID: \${pedido.id.slice(-6).toUpperCase()}) ya fue enviado. Aquí tienes la foto de tu guía de envío para que puedas recogerlo: \${pedido.guiaEnvioUrl}\`)} className="px-3 py-1.5 bg-green-500 text-white shadow-md rounded-lg"><MessageCircle className="w-4 h-4"/></button>
                      )}
                    </div>
                  )}

                  {filtroTab === 'listos' && pedido.tipoEntrega === 'RECOJO_TIENDA' && (
                     <button onClick={() => entregarPedidoEnTienda(pedido)} className="w-full mt-2 px-3 py-2 bg-orange-500 shadow-md hover:bg-orange-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2">
                       <CheckCircle className="w-4 h-4" /> Entregar en Tienda
                     </button>
                  )}

                </div>
              </div>
            )
          })}
        </div>`;
  pedidosCode = pedidosCode.replace(tableEnd, cardView);
}

// Make sure `Entregar en tienda` button exists in the desktop table as well
const printTicketButton = `{pedido.estado !== 'Rechazado' && !esTiendaDirecta && (`;
if (pedidosCode.includes(printTicketButton) && !pedidosCode.includes('entregarPedidoEnTienda(pedido)')) {
  const desktopDeliverBtn = `
                    {filtroTab === 'listos' && pedido.tipoEntrega === 'RECOJO_TIENDA' && (
                       <button onClick={() => entregarPedidoEnTienda(pedido)} className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md flex flex-shrink-0 items-center gap-2 font-bold text-xs">
                         <CheckCircle className="w-4 h-4" /> Entregar en Tienda
                       </button>
                    )}
                    
                    `;
  pedidosCode = pedidosCode.replace(printTicketButton, desktopDeliverBtn + printTicketButton);
}

fs.writeFileSync('src/app/admin/pedidos/page.tsx', pedidosCode);
console.log('Fixed pedidos/page.tsx');
