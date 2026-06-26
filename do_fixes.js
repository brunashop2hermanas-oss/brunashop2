const fs = require('fs');

async function main() {
  let actionsContent = fs.readFileSync('src/app/actions/ventas.ts', 'utf8');
  if (!actionsContent.includes('export async function deleteVenta')) {
    actionsContent += `

export async function deleteVenta(id: string) {
  try {
    await prisma.venta.delete({
      where: { id }
    });
    revalidatePath("/admin/pedidos");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
`;
    fs.writeFileSync('src/app/actions/ventas.ts', actionsContent);
    console.log("Added deleteVenta to ventas.ts");
  }

  let pageContent = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf8');

  // 1. Add import for deleteVenta
  if (!pageContent.includes('deleteVenta')) {
    pageContent = pageContent.replace(
      'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio } from "@/app/actions/ventas";',
      'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";'
    );
  }

  // 2. Add borrarDefinitivamente function
  if (!pageContent.includes('const borrarDefinitivamente = async (id: string) =>')) {
    pageContent = pageContent.replace(
      `  const restaurarPago = async (pedido: any) => {`,
      `  const borrarDefinitivamente = async (id: string) => {
    if (!window.confirm("¿Estás súper segura de que quieres ELIMINAR DEFINITIVAMENTE este pedido? Esta acción no se puede deshacer.")) return;
    const res = await deleteVenta(id);
    if (res.success) {
      setPedidos(pedidos.filter(p => p.id !== id));
      alert("Pedido eliminado definitivamente.");
    } else {
      alert("Error al eliminar el pedido.");
    }
  };

  const restaurarPago = async (pedido: any) => {`
    );
  }

  // 3. Fix the search bar sizing
  pageContent = pageContent.replace(
    `className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:max-w-xs relative"`,
    `className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:min-w-[280px] sm:max-w-md relative flex-1"`
  );
  
  // 4. Update the tabs order (Rechazados after Historial)
  // We'll replace the entire tabs div from '<div className="flex flex-col sm:flex-row bg-surface border border-surface-border p-1.5 rounded-2xl gap-2 overflow-x-auto custom-scrollbar">'
  // to the closing '</div>' of that block.
  
  const oldTabsHTML = `      <div className="mb-8">
        <div className="flex flex-col sm:flex-row bg-surface border border-surface-border p-1.5 rounded-2xl gap-2 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setFiltroTab('pagos')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'pagos' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Wallet className="w-5 h-5" /> Confirmar Pago
            {counts.pagos > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'pagos' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.pagos}
              </span>
            )}
          </button>
          
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('empaquetar')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'empaquetar' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Package className="w-5 h-5" /> Empaquetar
            {counts.empaquetar > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'empaquetar' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.empaquetar}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('guias')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'guias' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Truck className="w-5 h-5" /> Enviar Guía
            {counts.guias > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'guias' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.guias}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
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
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 \${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <History className="w-5 h-5" /> Historial
          </button>
        </div>
      </div>`;

  const newTabsHTML = `      <div className="mb-8">
        <div className="flex flex-col sm:flex-row bg-surface border border-surface-border p-1.5 rounded-2xl gap-2 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setFiltroTab('pagos')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'pagos' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Wallet className="w-5 h-5" /> Confirmar Pago
            {counts.pagos > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'pagos' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.pagos}
              </span>
            )}
          </button>
          
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('empaquetar')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'empaquetar' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Package className="w-5 h-5" /> Empaquetar
            {counts.empaquetar > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'empaquetar' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.empaquetar}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('guias')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative \${filtroTab === 'guias' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <Truck className="w-5 h-5" /> Enviar Guía
            {counts.guias > 0 && (
              <span className={\`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm \${filtroTab === 'guias' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}\`}>
                {counts.guias}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('historial')}
            className={\`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 \${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}\`}
          >
            <History className="w-5 h-5" /> Historial
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
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
        </div>
      </div>`;

  if (pageContent.includes('Confirmar Pago') && pageContent.includes('Empaquetar')) {
    pageContent = pageContent.replace(oldTabsHTML, newTabsHTML);
  }

  // 5. Add Borrar Definitivamente button to the Rechazados tab rendering
  // We'll replace the existing 'Restaurar Pedido' block to also include the delete button.
  // We need to find where the restaurar button is in page.tsx if it exists. Wait, earlier I found that there is NO restaurar button rendered in page.tsx in the main list. Oh! The screenshot showed it on the list! Let me check the screenshot again... "Restaurar Pedido" in green, "Acuerdo Legal" in grey.
  // Let me search page.tsx for "Restaurar Pedido" right now.
  if (pageContent.includes('Restaurar Pedido')) {
    pageContent = pageContent.replace(
      /(\{\/\* AQUI AGREGAR RESTAURAR PEDIDO \*\/\}|<button[^>]+onClick\{\(\) => restaurarPago\(pedido\)\}.*?<\/button>)/s,
      \`<div className="flex flex-col gap-2 w-full">
         <button onClick={() => restaurarPago(pedido)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
           <History className="w-4 h-4"/> Restaurar Pedido
         </button>
         <button onClick={() => borrarDefinitivamente(pedido.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
           <XCircle className="w-4 h-4"/> Borrar Definitivamente
         </button>
       </div>\`
    );
  } else {
    // If it's not found, maybe I need to inject it where `pedido.estado === 'Rechazado'` is handled.
    // Right now, let's inject it at the end of the actions block.
    const actionsEnd = \`{(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias')) && (\`;
    pageContent = pageContent.replace(
      actionsEnd,
      \`{filtroTab === 'rechazados' && (
        <div className="flex flex-col gap-2 w-full">
         <button onClick={() => restaurarPago(pedido)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
           <History className="w-4 h-4"/> Restaurar Pedido
         </button>
         <button onClick={() => borrarDefinitivamente(pedido.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
           <XCircle className="w-4 h-4"/> Borrar Definitivamente
         </button>
       </div>
      )}
      
      \` + actionsEnd
    );
  }

  // 6. Alert confirmation for Aprobar and Rechazar.
  // Wait, these functions ALREADY have window.confirm in page.tsx! Look:
  // const aprobarPago = async (pedido: any) => {
  //  if (!window.confirm("¿Estás segura de que quieres APROBAR este pago? El pedido pasará a la etapa de empaquetado.")) return;
  //  ...
  //
  // BUT the user says: "lo mismo para aprobar pago y rechazar que pueda verificar si estoy seguro o no por favor"
  // Is it possible the buttons in the modal don't call aprobarPago but do something else?
  // Let's check the modal:
  // <button onClick={() => rechazarPago(pedidoSeleccionado)}
  // <button onClick={() => aprobarPago(pedidoSeleccionado)}
  // The logic is already there! But maybe she hasn't tested it because the fix was from my PREVIOUS conversation attempt where `node fix_pedidos.js` didn't get pushed?
  // Ah! If my previous `fix_pedidos.js` NEVER GOT PUSHED, she DOES NOT HAVE IT IN RENDER!
  // BUT I checked `page.tsx` now and it DOES have `window.confirm`!
  // Wait! Did I look at `page.tsx` on my LOCAL disk or in Render? I looked at my LOCAL disk.
  // Since `git status` says "nothing added to commit", my LOCAL disk has `window.confirm`.
  // BUT if `git status` says it's UNMODIFIED from `origin/main`, that means `origin/main` HAS `window.confirm`.
  // And `origin/main` is what Render pulls!
  // Wait... maybe she means the "Verificar Pago" button itself should have a confirmation? No, "Verificar Pago" opens the Modal. "lo mismo para aprobar pago y rechazar" literally refers to the buttons inside the modal or the ones that say "Aprobar/Rechazar".
  // Let me just make the alerts standard browser `window.confirm`. Wait, it ALREADY IS `window.confirm`.
  // I'll change it to SweetAlert or standard `confirm()` to be sure. It already is `window.confirm`. I will just push to Render again after adding the new features!

  fs.writeFileSync('src/app/admin/pedidos/page.tsx', pageContent);
  console.log("Updated page.tsx");
}

main().catch(console.error);
