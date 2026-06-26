const fs = require('fs');
const filePath = 'src/app/admin/reportes/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add State
if (!content.includes('const [ventaABorrar, setVentaABorrar]')) {
    content = content.replace(
        'const [reportes, setReportes] = useState<any>({',
        'const [ventaABorrar, setVentaABorrar] = useState<string | null>(null);\n  const [reportes, setReportes] = useState<any>({'
    );
}

// 2. Add AnimatePresence import if missing
if (!content.includes('AnimatePresence')) {
    content = content.replace(
        'import { motion } from "framer-motion";',
        'import { motion, AnimatePresence } from "framer-motion";'
    );
}

// 3. Update handleDeleteVenta
const oldHandleDeleteVenta = `  const handleDeleteVenta = async (ventaId: string) => {
    if (confirm("¿Estás seguro de eliminar esta venta por completo? El stock será devuelto al catálogo y los puntos restados." )) {
      setLoading(true);
      const res = await deleteVenta(ventaId);
      if (res.success) {
        alert("Venta eliminada y stock restaurado con éxito.");
        // Refetch
        const queryParam = rango === "Especifica" ? \`fecha:\${fechaEspecifica}\` : rango;
        const reportRes = await getReportesFinancieros(queryParam);
        if (reportRes.success && reportRes.data) {
          setReportes(reportRes.data as any);
        }
      } else {
        alert("Error al eliminar venta: " + res.error);
      }
      setLoading(false);
    }
  };`;

const newHandleDeleteVenta = `  const handleDeleteVenta = (ventaId: string) => {
    setVentaABorrar(ventaId);
  };

  const confirmDeleteVenta = async () => {
    if (!ventaABorrar) return;
    setLoading(true);
    const res = await deleteVenta(ventaABorrar);
    if (res.success) {
      alert("Venta eliminada y stock restaurado con éxito.");
      const queryParam = rango === "Especifica" ? \`fecha:\${fechaEspecifica}\` : rango;
      const reportRes = await getReportesFinancieros(queryParam);
      if (reportRes.success && reportRes.data) {
        setReportes(reportRes.data as any);
      }
    } else {
      alert("Error al eliminar venta: " + res.error);
    }
    setVentaABorrar(null);
    setLoading(false);
  };`;

if (content.includes(oldHandleDeleteVenta)) {
    content = content.replace(oldHandleDeleteVenta, newHandleDeleteVenta);
}

// 4. Inject Modal JSX before the final </div>
const modalJSX = `
      {/* VENTA DELETE MODAL */}
      <AnimatePresence>
        {ventaABorrar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 no-print">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setVentaABorrar(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background w-full max-w-sm rounded-3xl overflow-hidden relative z-10 shadow-2xl border border-surface-border"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">Eliminar Venta</h2>
                <p className="text-sm text-foreground/60 mb-6">
                  ¿Estás seguro de eliminar esta venta por completo? <br/><br/>
                  <span className="font-bold">El stock será devuelto al catálogo y los puntos restados a la clienta (si corresponde). Esta acción no se puede deshacer.</span>
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setVentaABorrar(null)} disabled={loading} className="flex-1 bg-surface border border-surface-border text-foreground font-bold py-3 rounded-xl hover:bg-background transition-colors disabled:opacity-50">
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteVenta}
                    disabled={loading}
                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center"
                  >
                    {loading ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex !== -1 && !content.includes('VENTA DELETE MODAL')) {
    content = content.substring(0, lastDivIndex) + modalJSX + '\n' + content.substring(lastDivIndex);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Patched reportes page');
