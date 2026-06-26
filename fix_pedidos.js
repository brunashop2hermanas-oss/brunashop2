const fs = require('fs');
let content = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

// 1. Confirmations
content = content.replace(
  `const aprobarPago = async (pedido: any) => {`,
  `const aprobarPago = async (pedido: any) => {
    if (!window.confirm("¿Estás segura de que quieres APROBAR este pago? El pedido pasará a la etapa de empaquetado.")) return;`
);

content = content.replace(
  `const rechazarPago = async (pedido: any) => {`,
  `const rechazarPago = async (pedido: any) => {
    if (!window.confirm("¿Estás segura de que quieres RECHAZAR este pago? El pedido será movido a Rechazados.")) return;`
);

// 2. Add 'rechazados' tab state and action
content = content.replace(
  `const [filtroTab, setFiltroTab] = useState<'pagos' | 'empaquetar' | 'guias' | 'historial'>('pagos');`,
  `const [filtroTab, setFiltroTab] = useState<'pagos' | 'empaquetar' | 'guias' | 'historial' | 'rechazados'>('pagos');
  
  const restaurarPago = async (pedido: any) => {
    if (!window.confirm("¿Deseas RESTAURAR este pedido? Volverá a estar pendiente de verificación.")) return;
    const res = await updateEstadoVenta(pedido.id, 'Pendiente');
    if (res.success) {
      const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: 'Pendiente' } : p);
      setPedidos(nuevosPedidos);
      toast.success("Pedido restaurado a Pendiente.");
    } else {
      toast.error("Error al restaurar pedido.");
    }
  };`
);

// 3. Tab buttons
content = content.replace(
  `          <button 
            onClick={() => setFiltroTab('historial')}
            className={\`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'historial' ? 'bg-green-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <History className="w-5 h-5" /> Historial
          </button>`,
  `          <button 
            onClick={() => setFiltroTab('rechazados')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <XCircle className="w-5 h-5" /> Rechazados
            {counts.rechazados > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}\`}>
                {counts.rechazados}
              </span>
            )}
          </button>
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <button 
            onClick={() => setFiltroTab('historial')}
            className={\`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'historial' ? 'bg-green-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <History className="w-5 h-5" /> Historial
          </button>`
);

// 4. Update Filtering Logic
const filterOld = `    const textoBusqueda = busqueda.toLowerCase();
    const coincideBusqueda = 
      (pedido.cliente && pedido.cliente.toLowerCase().includes(textoBusqueda)) || 
      (pedido.ci && pedido.ci.includes(textoBusqueda)) || 
      (pedido.id && pedido.id.toLowerCase().includes(textoBusqueda));

    if (busqueda && !coincideBusqueda) return false;

    if (filtroTab === 'pagos') return pedido.estado === 'Pendiente' && !esAbandonado;
    if (filtroTab === 'empaquetar') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'guias') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'historial') return pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO');
    
    return true;`;

const filterNew = `    const textoBusqueda = busqueda.toLowerCase().trim();
    if (textoBusqueda) {
      const coincideBusqueda = 
        (pedido.cliente && pedido.cliente.toLowerCase().includes(textoBusqueda)) || 
        (pedido.ci && pedido.ci.includes(textoBusqueda)) || 
        (pedido.id && pedido.id.toLowerCase().includes(textoBusqueda));
      return coincideBusqueda;
    }

    if (filtroTab === 'pagos') return pedido.estado === 'Pendiente' && !esAbandonado;
    if (filtroTab === 'empaquetar') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'guias') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'rechazados') return pedido.estado === 'Rechazado';
    if (filtroTab === 'historial') return pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO');
    
    return true;`;

content = content.replace(filterOld, filterNew);

// 5. Override Render list for search across all dates
const renderListOld = `  const pedidosARenderizar = filtroTab === 'historial' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados;`;
const renderListNew = `  const pedidosARenderizar = busqueda.trim() ? pedidos.filter(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return false;
    const t = busqueda.toLowerCase().trim();
    return (pedido.cliente && pedido.cliente.toLowerCase().includes(t)) || 
           (pedido.ci && pedido.ci.includes(t)) || 
           (pedido.id && pedido.id.toLowerCase().includes(t));
  }) : (filtroTab === 'historial' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados);`;
content = content.replace(renderListOld, renderListNew);

// 6. Counts logic
const countOld = `const counts = { pagos: 0, empaquetar: 0, guias: 0, historial: 0 };`;
const countNew = `const counts = { pagos: 0, empaquetar: 0, guias: 0, historial: 0, rechazados: 0 };`;
content = content.replace(countOld, countNew);

const countLogicOld = `else if (pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO')) counts.historial++;`;
const countLogicNew = `else if (pedido.estado === 'Rechazado') counts.rechazados++;
    else if (pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO')) counts.historial++;`;
content = content.replace(countLogicOld, countLogicNew);

// 7. Render "Restaurar" button for rejected items
const actionButtonsOld = `{pedido.estado === 'Pendiente' && (
                      <button 
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Ver Comprobante"
                      >
                        <Eye className="w-4 h-4" /> Verificar Pago
                      </button>
                    )}`;
const actionButtonsNew = `{pedido.estado === 'Pendiente' && (
                      <button 
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Ver Comprobante"
                      >
                        <Eye className="w-4 h-4" /> Verificar Pago
                      </button>
                    )}
                    
                    {pedido.estado === 'Rechazado' && (
                      <button 
                        onClick={() => restaurarPago(pedido)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Restaurar a Pendiente"
                      >
                        <History className="w-4 h-4" /> Restaurar Pedido
                      </button>
                    )}`;
content = content.replace(actionButtonsOld, actionButtonsNew);


fs.writeFileSync('src/app/admin/pedidos/page.tsx', content);
console.log('Script completed');
