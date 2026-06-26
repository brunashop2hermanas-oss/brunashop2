const fs = require('fs');

function main() {
    const ventas_path = 'src/app/actions/ventas.ts';
    let actions_content = fs.readFileSync(ventas_path, 'utf8');
    
    if (!actions_content.includes('export async function deleteVenta')) {
        actions_content += "\n\nexport async function deleteVenta(id: string) {\n  try {\n    await prisma.venta.delete({\n      where: { id }\n    });\n    revalidatePath(\"/admin/pedidos\");\n    return { success: true };\n  } catch (error: any) {\n    return { success: false, error: error.message };\n  }\n}\n";
        fs.writeFileSync(ventas_path, actions_content, 'utf8');
        console.log("Added deleteVenta to ventas.ts");
    }

    const page_path = 'src/app/admin/pedidos/page.tsx';
    let page_content = fs.readFileSync(page_path, 'utf8');

    // 1. Imports
    if (!page_content.includes('deleteVenta')) {
        page_content = page_content.replace(
            'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio } from "@/app/actions/ventas";',
            'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";'
        );
    }

    // 2. Borrar Definitivamente function
    if (!page_content.includes('const borrarDefinitivamente')) {
        const target = "  const restaurarPago = async (pedido: any) => {";
        const replacement = "  const borrarDefinitivamente = async (id: string) => {\n    if (!window.confirm(\"¿Estás súper segura de que quieres ELIMINAR DEFINITIVAMENTE este pedido? Esta acción no se puede deshacer.\")) return;\n    const res = await deleteVenta(id);\n    if (res.success) {\n      setPedidos(pedidos.filter(p => p.id !== id));\n      toast.success(\"Pedido eliminado definitivamente.\");\n    } else {\n      toast.error(\"Error al eliminar el pedido.\");\n    }\n  };\n\n  const restaurarPago = async (pedido: any) => {";
        page_content = page_content.replace(target, replacement);
    }

    // 3. Search Bar Size
    const target_search = 'className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:max-w-xs relative"';
    const replacement_search = 'className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:min-w-[280px] sm:max-w-md relative flex-1 shrink-0"';
    page_content = page_content.replace(target_search, replacement_search);

    // 4. Tabs Order
    const rechazados_block = "          <button \n            onClick={() => setFiltroTab('rechazados')}\n            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}\n          >\n            <XCircle className=\"w-5 h-5\" /> Rechazados\n            {counts.rechazados > 0 && (\n              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>\n                {counts.rechazados}\n              </span>\n            )}\n          </button>\n\n          <div className=\"hidden sm:flex items-center text-surface-border shrink-0\">\n            <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"m9 18 6-6-6-6\"/></svg>\n          </div>";
    
    const historial_block = "          <button \n            onClick={() => setFiltroTab('historial')}\n            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}\n          >\n            <History className=\"w-5 h-5\" /> Historial\n          </button>";

    if (page_content.includes(rechazados_block) && page_content.includes(historial_block)) {
        const idx_r = page_content.indexOf(rechazados_block);
        const idx_h = page_content.indexOf(historial_block);
        if (idx_r < idx_h) {
            const new_historial = "          <button \n            onClick={() => setFiltroTab('historial')}\n            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${filtroTab === 'historial' ? 'bg-slate-800 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}\n          >\n            <History className=\"w-5 h-5\" /> Historial\n          </button>\n          \n          <div className=\"hidden sm:flex items-center text-surface-border shrink-0\">\n            <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" strokeLinecap=\"round\" strokeLinejoin=\"round\"><path d=\"m9 18 6-6-6-6\"/></svg>\n          </div>\n\n          <button \n            onClick={() => setFiltroTab('rechazados')}\n            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}\n          >\n            <XCircle className=\"w-5 h-5\" /> Rechazados\n            {counts.rechazados > 0 && (\n              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>\n                {counts.rechazados}\n              </span>\n            )}\n          </button>";
            
            page_content = page_content.replace(rechazados_block, "");
            page_content = page_content.replace(historial_block, new_historial);
        }
    }

    // 5. Add buttons to Rechazados Tab UI
    const target_render = "                  {(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias')) && (";
    const insert_buttons = "                  {filtroTab === 'rechazados' && (\n                    <div className=\"flex flex-col gap-2 w-full mt-2\">\n                      <button onClick={() => restaurarPago(pedido)} className=\"px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors\">\n                        <History className=\"w-4 h-4\"/> Restaurar Pedido\n                      </button>\n                      <button onClick={() => borrarDefinitivamente(pedido.id)} className=\"px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors\">\n                        <XCircle className=\"w-4 h-4\"/> Borrar Definitivamente\n                      </button>\n                    </div>\n                  )}\n                  \n";
    
    if (!page_content.includes("borrarDefinitivamente(pedido.id)")) {
        page_content = page_content.replace(target_render, insert_buttons + target_render);
    }

    fs.writeFileSync(page_path, page_content, 'utf8');
    console.log("Updated page.tsx successfully!");
}

main();
