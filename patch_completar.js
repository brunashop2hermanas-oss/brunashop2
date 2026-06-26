const fs = require('fs');
let content = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf-8');

// Inject state
content = content.replace('const [busqueda, setBusqueda] = useState("");', 'const [busqueda, setBusqueda] = useState("");\n  const [pedidoACompletar, setPedidoACompletar] = useState<any>(null);');

// Inject handler
const handlerCode = `
  const handleCompletarSinGuia = async () => {
    if (!pedidoACompletar) return;
    const res = await updateEstadoVenta(pedidoACompletar.id, 'ENTREGADO');
    if (res.success) {
      const nuevosPedidos = pedidos.map(p => p.id === pedidoACompletar.id ? { ...p, estado: 'ENTREGADO' } : p);
      setPedidos(nuevosPedidos);
      toast.success('Pedido marcado como completado y enviado a historial.');
      setPedidoACompletar(null);
    } else {
      toast.error('Error al completar el pedido.');
    }
  };
`;
content = content.replace('const fetchPedidos = async () => {', handlerCode + '\n  const fetchPedidos = async () => {');

// Inject Button
const buttonCode = `
                        {filtroTab === 'guias' && !pedido.guiaEnvioUrl && (
                          <button 
                            title="Completar sin Guía"
                            onClick={() => setPedidoACompletar(pedido)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shadow-sm border border-slate-300 font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Completar
                          </button>
                        )}
`;
// find <Upload className="w-4 h-4" /> Subir Guía
// and put the button right after the relative group div
content = content.replace('</label>\n                        </div>', '</label>\n                        </div>' + buttonCode);

// Inject Modal
const modalCode = `
      {/* Modal Completar Sin Guia */}
      <AnimatePresence>
        {pedidoACompletar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 no-print">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPedidoACompletar(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl z-10 w-full max-w-md border border-brand-primary/20"
            >
              <div className="bg-blue-50 p-6 flex flex-col items-center justify-center border-b border-blue-100">
                <div className="bg-blue-100 p-4 rounded-full mb-4 shadow-inner">
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">¿Completar pedido?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 text-center text-sm">
                  Estás a punto de marcar el pedido de <strong className="text-slate-800">{pedidoACompletar.cliente}</strong> como <strong className="text-blue-600">COMPLETADO</strong> sin subir una guía de envío.
                </p>
                <p className="text-slate-500 text-center text-xs">
                  El pedido se moverá a la pestaña de <strong className="text-slate-700">Historial</strong> y se considerará entregado.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button 
                    onClick={() => setPedidoACompletar(null)}
                    className="py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCompletarSinGuia}
                    className="py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirmar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
content = content.replace('      {/* Lightbox para Comprobante Ampliado */}', modalCode + '\n      {/* Lightbox para Comprobante Ampliado */}');

fs.writeFileSync('src/app/admin/pedidos/page.tsx', content);
console.log('Done!');
