const fs = require('fs');

let code = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

// 1. Rename the state type
code = code.replace(
  `const [filtroTab, setFiltroTab] = useState<'pendientes' | 'listos' | 'enviados'>('pendientes');`,
  `const [filtroTab, setFiltroTab] = useState<'pagos' | 'empaquetar' | 'guias' | 'historial'>('pagos');`
);

// 2. Update the Tab Buttons UI
const oldTabs = `        {/* Pestañas (Tabs) */}
        <div className="flex bg-surface border border-surface-border p-1 rounded-xl">
          <button 
            onClick={() => setFiltroTab('pendientes')}
            className={\`px-4 py-2 rounded-lg font-bold text-sm transition-all \${filtroTab === 'pendientes' ? 'bg-brand-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Pendientes
          </button>
          <button 
            onClick={() => setFiltroTab('listos')}
            className={\`px-4 py-2 rounded-lg font-bold text-sm transition-all \${filtroTab === 'listos' ? 'bg-orange-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Listos para Enviar
          </button>
          <button 
            onClick={() => setFiltroTab('enviados')}
            className={\`px-4 py-2 rounded-lg font-bold text-sm transition-all \${filtroTab === 'enviados' ? 'bg-green-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Enviados / Historial
          </button>
        </div>`;

const newTabs = `        {/* Pestañas (Tabs) */}
        <div className="flex flex-wrap bg-surface border border-surface-border p-1 rounded-xl gap-1">
          <button 
            onClick={() => setFiltroTab('pagos')}
            className={\`px-3 py-2 rounded-lg font-bold text-xs transition-all \${filtroTab === 'pagos' ? 'bg-brand-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Confirmar Pago
          </button>
          <button 
            onClick={() => setFiltroTab('empaquetar')}
            className={\`px-3 py-2 rounded-lg font-bold text-xs transition-all \${filtroTab === 'empaquetar' ? 'bg-orange-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Empaquetado Pendiente
          </button>
          <button 
            onClick={() => setFiltroTab('guias')}
            className={\`px-3 py-2 rounded-lg font-bold text-xs transition-all \${filtroTab === 'guias' ? 'bg-blue-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Enviar Guía
          </button>
          <button 
            onClick={() => setFiltroTab('historial')}
            className={\`px-3 py-2 rounded-lg font-bold text-xs transition-all \${filtroTab === 'historial' ? 'bg-green-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}\`}
          >
            Historial
          </button>
        </div>`;

code = code.replace(oldTabs, newTabs);

// 3. Update the filter logic
const oldFilter = `    if (filtroTab === 'pendientes') return !todasEmpaquetadas && !esAbandonado && !esTiendaDirecta && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'listos') return todasEmpaquetadas && !esAbandonado && !pedido.guiaEnvioUrl && !esTiendaDirecta && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'enviados') return (todasEmpaquetadas && !esAbandonado && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && !esAbandonado) || pedido.estado === 'ENTREGADO';`;

const newFilter = `    if (filtroTab === 'pagos') return pedido.estado === 'Pendiente' && !esAbandonado;
    if (filtroTab === 'empaquetar') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'guias') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'historial') return pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO');`;

code = code.replace(oldFilter, newFilter);

// 4. Update slice
code = code.replace(
  `const pedidosARenderizar = filtroTab === 'enviados' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados;`,
  `const pedidosARenderizar = filtroTab === 'historial' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados;`
);

// 5. Update Desktop Buttons
// Replace `filtroTab === 'listos'` with `filtroTab === 'guias'`
code = code.replace(/filtroTab === 'listos'/g, `filtroTab === 'guias'`);
// Replace `filtroTab === 'enviados'` with `filtroTab === 'historial'`
code = code.replace(/filtroTab === 'enviados'/g, `filtroTab === 'historial'`);

// 6. Add "Finalizar" button in Guias tab (Desktop)
const desktopFinalizar = `
                      {filtroTab === 'guias' && (
                        <button onClick={() => entregarPedidoEnTienda(pedido)} className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg shadow-md flex flex-shrink-0 items-center gap-2 font-bold text-xs" title="Finalizar sin guía">
                          <CheckCircle className="w-4 h-4" /> Finalizar
                        </button>
                      )}
`;
if (code.includes(`{pedido.guiaEnvioUrl && (`)) {
  const insertBeforeDesktop = `{filtroTab === 'guias' && pedido.tipoEntrega === 'RECOJO_TIENDA' && (`;
  code = code.replace(insertBeforeDesktop, desktopFinalizar + '\n                    ' + insertBeforeDesktop);
}

// 7. Add "Finalizar" button in Guias tab (Mobile)
const mobileFinalizar = `
                  {filtroTab === 'guias' && (
                     <button onClick={() => entregarPedidoEnTienda(pedido)} className="w-full mt-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md">
                       <CheckCircle className="w-4 h-4" /> Finalizar sin Guía
                     </button>
                  )}
`;
const insertBeforeMobile = `{filtroTab === 'guias' && pedido.tipoEntrega === 'RECOJO_TIENDA' && (`;
code = code.replace(insertBeforeMobile, mobileFinalizar + '\n                  ' + insertBeforeMobile);

fs.writeFileSync('src/app/admin/pedidos/page.tsx', code);
console.log("Refactored pedidos page");
