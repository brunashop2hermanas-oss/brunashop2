import os

def main():
    ventas_path = 'src/app/actions/ventas.ts'
    with open(ventas_path, 'r', encoding='utf-8') as f:
        actions_content = f.read()
    
    if 'export async function deleteVenta' not in actions_content:
        actions_content += """

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
"""
        with open(ventas_path, 'w', encoding='utf-8') as f:
            f.write(actions_content)
        print("Added deleteVenta to ventas.ts")

    page_path = 'src/app/admin/pedidos/page.tsx'
    with open(page_path, 'r', encoding='utf-8') as f:
        page_content = f.read()

    # 1. Imports
    if 'deleteVenta' not in page_content:
        page_content = page_content.replace(
            'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio } from "@/app/actions/ventas";',
            'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";'
        )

    # 2. Borrar Definitivamente function
    if 'const borrarDefinitivamente' not in page_content:
        target = "  const restaurarPago = async (pedido: any) => {"
        replacement = """  const borrarDefinitivamente = async (id: string) => {
    if (!window.confirm("¿Estás súper segura de que quieres ELIMINAR DEFINITIVAMENTE este pedido? Esta acción no se puede deshacer.")) return;
    const res = await deleteVenta(id);
    if (res.success) {
      setPedidos(pedidos.filter(p => p.id !== id));
      toast.success("Pedido eliminado definitivamente.");
    } else {
      toast.error("Error al eliminar el pedido.");
    }
  };

  const restaurarPago = async (pedido: any) => {"""
        page_content = page_content.replace(target, replacement)

    # 3. Search Bar Size
    target_search = 'className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:max-w-xs relative"'
    replacement_search = 'className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:min-w-[280px] sm:max-w-md relative flex-1 shrink-0"'
    page_content = page_content.replace(target_search, replacement_search)

    # 4. Tabs Order: Replace the whole <div> block
    # Actually, I'll just change the text 'rechazados' and 'historial' positions, or carefully extract and swap them.
    # It is easier to find the exact block for Rechazados:
    rechazados_block = """          <button 
            onClick={() => setFiltroTab('rechazados')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <XCircle className="w-5 h-5" /> Rechazados
            {counts.rechazados > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>
                {counts.rechazados}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>"""
    
    historial_block = """          <button 
            onClick={() => setFiltroTab('historial')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <History className="w-5 h-5" /> Historial
          </button>"""

    if rechazados_block in page_content and historial_block in page_content:
        # Check order:
        idx_r = page_content.find(rechazados_block)
        idx_h = page_content.find(historial_block)
        if idx_r < idx_h:
            # They are in original order, let's swap them
            # First remove rechazados
            page_content = page_content.replace(rechazados_block + "\n", "")
            # Now insert it after historial
            # Wait, historial is the last tab right now, so we can just append it
            replacement_historial = historial_block + """

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
""" + "\n" + rechazados_block
            
            # Note: the rechazados_block ALREADY has the <svg> divider AFTER it, so we need to be careful.
            # If we put it at the end, the <svg> divider should be BEFORE it.
            # Let's do a more robust approach:
            
            new_historial = """          <button 
            onClick={() => setFiltroTab('historial')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <History className="w-5 h-5" /> Historial
          </button>
          
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('rechazados')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <XCircle className="w-5 h-5" /> Rechazados
            {counts.rechazados > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>
                {counts.rechazados}
              </span>
            )}
          </button>"""
            
            # Remove original rechazados block
            page_content = page_content.replace(rechazados_block, "")
            # Replace historial block with the new combined one
            page_content = page_content.replace(historial_block, new_historial)

    # 5. Add Borrar Definitivamente button in Rechazados tab logic
    # Right now, there is NO buttons for rechazados in the JSX list at the bottom.
    # We find where we render the buttons:
    target_render = """                  {(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias')) && ("""
    
    insert_buttons = """                  {filtroTab === 'rechazados' && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <button onClick={() => restaurarPago(pedido)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                        <History className="w-4 h-4"/> Restaurar Pedido
                      </button>
                      <button onClick={() => borrarDefinitivamente(pedido.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                        <XCircle className="w-4 h-4"/> Borrar Definitivamente
                      </button>
                    </div>
                  )}
                  
"""
    if insert_buttons not in page_content:
        page_content = page_content.replace(target_render, insert_buttons + target_render)


    with open(page_path, 'w', encoding='utf-8') as f:
        f.write(page_content)
    print("Updated page.tsx")

if __name__ == '__main__':
    main()
