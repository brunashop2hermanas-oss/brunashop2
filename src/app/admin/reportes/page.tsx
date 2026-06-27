"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Download, TrendingUp, DollarSign, Calendar, Package, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { getReportesFinancieros } from "@/app/actions/reportes";
import { deleteVenta } from "@/app/actions/ventas";
import { getUserRole } from "@/app/actions/auth";
import { Trash2 } from "lucide-react";

export default function AdminReportes() {
  const [rango, setRango] = useState("Mensual");
  const [ventaABorrar, setVentaABorrar] = useState<string | null>(null);
  const [fechaEspecifica, setFechaEspecifica] = useState("");
  const [printMode, setPrintMode] = useState<"resumen" | "detalle">("resumen");
  const [reportes, setReportes] = useState({
    ingresosBrutos: 0,
    gananciaNeta: 0,
    prendasVendidas: 0,
    mejorDia: "Cargando...",
    categorias: [] as { nombre: string, porcentaje: number }[],
    ciudades: [] as { nombre: string, cantidad: number }[],
    transacciones: [] as any[],
    usarControlFinanciero: true
  });
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const fetchReportes = async () => {
      getUserRole().then(r => setUserRole(r || ""));
      setLoading(true);
      if (rango === "Especifica" && !fechaEspecifica) {
        setLoading(false);
        return; // Esperar a que elija una fecha
      }
      const queryParam = rango === "Especifica" ? `fecha:${fechaEspecifica}` : rango;
      const res = await getReportesFinancieros(queryParam);
      if (res.success && res.data) {
        setReportes(res.data as any);
      }
      setLoading(false);
    };
    fetchReportes();
    setVisibleCount(15);
  }, [rango, fechaEspecifica]);

  const handlePrintResumen = () => {
    setPrintMode("resumen");
    setTimeout(() => window.print(), 100);
  };

  const handleDeleteVenta = (ventaId: string) => {
    setVentaABorrar(ventaId);
  };

  const confirmDeleteVenta = async () => {
    if (!ventaABorrar) return;
    setLoading(true);
    const res = await deleteVenta(ventaABorrar);
    if (res.success) {
      alert("Venta eliminada y stock restaurado con éxito.");
      const queryParam = rango === "Especifica" ? `fecha:${fechaEspecifica}` : rango;
      const reportRes = await getReportesFinancieros(queryParam);
      if (reportRes.success && reportRes.data) {
        setReportes(reportRes.data as any);
      }
    } else {
      alert("Error al eliminar venta: " + res.error);
    }
    setVentaABorrar(null);
    setLoading(false);
  };

  const handlePrintDetalle = () => {
    setPrintMode("detalle");
    setTimeout(() => window.print(), 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Cabecera para Pantalla (Oculta en PDF) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-brand-primary" /> Reportes y Ganancias
          </h1>
          <p className="text-foreground/70 mt-1 mb-4">
            Visualiza tus ventas y exporta reportes financieros.
          </p>
          <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              <strong>Tip de uso:</strong> Puedes descargar un PDF para entregar a tu contador o archivar. Usa el filtro de fechas para ver cómo te fue hoy, esta semana o este mes.
            </p>
          </div>
        </div>
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center w-full md:w-auto">
          {/* Selector de Rango y Fecha */}
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
            <div className="flex items-center bg-background border border-surface-border px-3 py-2 rounded-xl shadow-inner w-full sm:w-auto relative group">
              <Calendar className="w-5 h-5 text-brand-primary mr-2 shrink-0" />
              <select 
                value={rango}
                onChange={(e) => setRango(e.target.value)}
                className="bg-transparent border-none outline-none w-full sm:w-40 text-sm font-bold text-foreground cursor-pointer appearance-none pr-6"
              >
                <option value="Diario">📅 Hoy</option>
                <option value="Semanal">📅 Esta Semana</option>
                <option value="Mensual">📅 Este Mes</option>
                <option value="Anual">📅 Este Año</option>
                <option value="Especifica">📌 Fecha Específica</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            {rango === 'Especifica' && (
              <input 
                type="date" 
                value={fechaEspecifica}
                onChange={(e) => setFechaEspecifica(e.target.value)}
                className="bg-background border border-brand-primary/50 px-3 py-2 rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-brand-primary shadow-inner w-full sm:w-auto"
              />
            )}
          </div>
          
          {/* Botones de Descarga */}
          <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto border-t xl:border-t-0 xl:border-l border-surface-border pt-4 xl:pt-0 xl:pl-4">
            <button 
              onClick={handlePrintResumen} 
              className="w-full sm:w-auto justify-center bg-brand-primary text-white px-4 py-3 rounded-xl font-bold shadow-lg hover:brightness-90 transition-all flex items-center gap-2 text-sm"
              title="Descarga el resumen financiero general de ingresos y productos"
            >
              <Download className="w-5 h-5 shrink-0" /> <span className="whitespace-nowrap">PDF Resumen</span>
            </button>
            <button 
              onClick={handlePrintDetalle} 
              className="w-full sm:w-auto justify-center bg-surface border border-surface-border text-foreground px-4 py-3 rounded-xl font-bold shadow-lg hover:bg-surface-border transition-all flex items-center gap-2 text-sm"
              title="Descarga un PDF con la lista detallada de cada transacción"
            >
              <FileText className="w-5 h-5 shrink-0" /> <span className="whitespace-nowrap">PDF Transacciones</span>
            </button>
          </div>
        </div>
      </div>

      {/* BLOQUE DE RESUMEN FINANCIERO */}
      <div className={printMode === "detalle" ? "print:hidden" : ""}>
        {/* Cabecera Oficial para PDF (Oculta en Pantalla) */}
        <div className="hidden print-header border-b-2 border-black pb-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="BrunaShop2" className="w-16 h-16 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">BrunaShop2</h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Resumen Financiero Oficial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">Fecha de Emisión: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
              <p className="text-sm font-bold">Período: <span className="font-normal uppercase">{rango === 'Especifica' ? fechaEspecifica : rango}</span></p>
            </div>
          </div>
        </div>

      {/* Tarjetas Resumen */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${reportes.usarControlFinanciero ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6 print-grid`}>
        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex flex-col justify-center print-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-500/20 text-green-500 rounded-xl no-print"><DollarSign className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest print-text-black">Ingresos Brutos</p>
          </div>
          <p className="text-3xl font-black text-foreground ml-2 print-text-black">Bs. {reportes.ingresosBrutos}</p>
          <p className="text-xs text-green-500 font-bold mt-2 ml-2 no-print">+15% vs mes anterior</p>
        </div>

        {reportes.usarControlFinanciero && (
          <div className="glass p-6 rounded-3xl border border-brand-primary/50 bg-brand-primary/5 shadow-3d shadow-brand-primary/10 flex flex-col justify-center relative overflow-hidden print-card print-highlight">
            <div className="absolute top-0 right-0 p-4 opacity-10 no-print"><TrendingUp className="w-24 h-24" /></div>
            <div className="flex items-center gap-3 mb-2 relative z-10">
              <div className="p-3 bg-brand-primary text-background rounded-xl no-print"><BarChart3 className="w-5 h-5" /></div>
              <p className="text-xs font-bold text-brand-primary uppercase tracking-widest print-text-black">Ganancia Neta (Bolsillo)</p>
            </div>
            <p className="text-3xl font-black text-brand-primary ml-2 relative z-10 print-text-black">Bs. {reportes.gananciaNeta}</p>
            <p className="text-xs text-foreground/60 font-bold mt-2 ml-2 relative z-10 no-print">Descontando costo de ropa</p>
          </div>
        )}

        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex flex-col justify-center print-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-500/20 text-blue-500 rounded-xl no-print"><Package className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest print-text-black">Prendas Vendidas</p>
          </div>
          <p className="text-3xl font-black text-foreground ml-2 print-text-black">{reportes.prendasVendidas}</p>
        </div>

        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex flex-col justify-center print-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-purple-500/20 text-purple-500 rounded-xl no-print"><Calendar className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-foreground/60 uppercase tracking-widest print-text-black">Mejor Día</p>
          </div>
          <p className="text-xl font-black text-foreground ml-2 mt-1 print-text-black">{reportes.mejorDia}</p>
        </div>
      </div>

      {/* Gráficos Simulados / Tablas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print-grid-2">
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d print-card">
          <h2 className="text-xl font-bold text-foreground mb-6 print-text-black border-b border-gray-300 pb-2">Ventas por Categoría</h2>
          <div className="space-y-4">
            {reportes.categorias.length > 0 ? reportes.categorias.map((cat, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm font-bold mb-1 print-text-black">
                  <span>{cat.nombre}</span>
                  <span>{cat.porcentaje}%</span>
                </div>
                <div className="w-full bg-surface-border rounded-full h-3 print-border">
                  <div className={`h-3 rounded-full print-bar ${idx === 0 ? 'bg-brand-primary' : idx === 1 ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: `${cat.porcentaje}%` }}></div>
                </div>
              </div>
            )) : <p className="text-sm text-foreground/60">Aún no hay datos.</p>}
          </div>
        </div>

        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d print-card">
          <h2 className="text-xl font-bold text-foreground mb-6 print-text-black border-b border-gray-300 pb-2">Ciudades de Envío Frecuentes</h2>
          <ul className="space-y-4">
            {reportes.ciudades.length > 0 ? reportes.ciudades.map((c, idx) => (
              <li key={idx} className="flex justify-between items-center p-3 bg-background rounded-xl border border-surface-border print-item">
                <span className="font-bold print-text-black">{idx + 1}. {c.nombre}</span>
                <span className="bg-surface px-3 py-1 rounded-full text-xs font-bold print-tag">{c.cantidad} Pedidos</span>
              </li>
            )) : <p className="text-sm text-foreground/60">Aún no hay datos.</p>}
          </ul>
        </div>
      </div>
      </div> {/* FIN DEL BLOQUE DE RESUMEN */}

      {/* BLOQUE DE TRANSACCIONES DETALLADAS */}
      <div className={printMode === "resumen" ? "print:hidden" : ""}>
        
        {/* Cabecera Oficial para PDF (Oculta en Pantalla) */}
        <div className="hidden print-header border-b-2 border-black pb-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="BrunaShop2" className="w-16 h-16 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
              <div>
                <h1 className="text-3xl font-black uppercase tracking-tighter">BrunaShop2</h1>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Historial de Transacciones Oficial</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">Fecha de Emisión: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
              <p className="text-sm font-bold">Período: <span className="font-normal uppercase">{rango}</span></p>
            </div>
          </div>
        </div>

        {/* Tabla de Detalle de Transacciones (Pantalla y PDF) */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d mt-8 print-card print-table-container">
          <h2 className="text-xl font-bold text-foreground mb-6 print-text-black border-b border-gray-300 pb-2">
            Historial Detallado de Transacciones
          </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse print-table">
            <thead>
              <tr className="bg-background/50 border-b border-surface-border print-table-header">
                <th className="p-4 text-sm font-bold print-text-black">Prenda Vendida</th>
                <th className="p-4 text-sm font-bold print-text-black">Monto</th>
                <th className="p-4 text-sm font-bold print-text-black">Clienta (Datos)</th>
                <th className="p-4 text-sm font-bold print-text-black">Responsable (Cajero)</th>
                <th className="p-4 text-sm font-bold print-text-black text-right">Fecha</th>
                {userRole === "ADMINISTRADOR" && <th className="p-4 text-sm font-bold print-text-black text-center no-print">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border print-table-body">
              {reportes.transacciones.length > 0 ? reportes.transacciones.slice(0, visibleCount).map(t => (
                <tr key={t.id} className="hover:bg-brand-primary/5 transition-colors print-item">
                  <td className="p-4">
                    <p className="font-bold print-text-black">{t.prendaNombre}</p>
                    <p className="text-xs text-foreground/60 print-text-black">Cant: {t.cantidad} | Talla: {t.talla} | Color: {t.color}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-green-600 print-text-black">Bs. {t.monto}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold print-text-black">{t.clientaNombre}</p>
                    <p className="text-xs text-foreground/60 print-text-black">{t.clientaDatos}</p>
                  </td>
                  <td className="p-4 print-text-black text-sm whitespace-nowrap">
                    <span className="inline-flex items-center justify-center bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold print-tag whitespace-nowrap">
                      {t.responsable}
                    </span>
                  </td>
                  <td className="p-4 text-right text-sm text-foreground/70 print-text-black">
                    {t.fecha.split(', ')[0]}<br/>{t.fecha.split(', ')[1] || ""}
                  </td>
                  {userRole === "ADMINISTRADOR" && (
                    <td className="p-4 text-center no-print">
                      <button onClick={() => handleDeleteVenta(t.ventaId)} className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar Venta (Restaurar Stock)">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={userRole === "ADMINISTRADOR" ? 6 : 5} className="p-4 text-center text-foreground/60">No hay transacciones en este período.</td></tr>
              )}
            </tbody>
          </table>
          
          {visibleCount < reportes.transacciones.length && (
            <div className="flex justify-center p-6 print:hidden">
              <button 
                onClick={() => setVisibleCount(prev => prev + 15)}
                className="bg-surface hover:bg-surface-border text-foreground border border-surface-border px-8 py-3 rounded-full font-bold shadow-sm transition-colors"
              >
                Cargar más transacciones ({reportes.transacciones.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </div>
      </div>
      </div> {/* FIN DEL BLOQUE DE TRANSACCIONES DETALLADAS */}

      {/* Firmas Oficiales para PDF */}
      <div className="hidden print-footer mt-20" style={{ pageBreakInside: 'avoid' }}>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="w-48 border-b-2 border-black mb-2 mx-auto"></div>
            <p className="font-bold text-sm">Firma Autorizada</p>
            <p className="text-xs text-gray-500">BrunaShop2 Administración</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b-2 border-black mb-2 mx-auto"></div>
            <p className="font-bold text-sm">Auditoría / Contabilidad</p>
            <p className="text-xs text-gray-500">Revisado</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: letter;
            margin: 2cm;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          aside, nav { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
          
          /* Mostrar elementos exclusivos de impresión */
          .print-header { display: block !important; }
          .print-footer { display: block !important; }

          /* Reestructurar cuadriculas para que quepan en la hoja */
          .print-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1rem !important;
            margin-bottom: 2rem !important;
          }
          
          .print-grid-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1rem !important;
            page-break-inside: avoid;
          }

          /* Limpiar tarjetas de estilos de pantalla pesados */
          .print-card {
            background: white !important;
            border: 1px solid #000 !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            padding: 1rem !important;
            page-break-inside: avoid;
          }
          
          .print-highlight {
            border: 2px solid #000 !important;
            background: #f8f8f8 !important;
          }

          /* Forzar textos en negro */
          .print-text-black { color: black !important; }
          
          .print-item {
            border: none !important;
            border-bottom: 1px solid #ccc !important;
            border-radius: 0 !important;
            background: transparent !important;
            padding: 0.5rem 0 !important;
          }
          .print-tag {
            border: 1px solid #000 !important;
            background: white !important;
            color: black !important;
          }
          
          .print-border { border: 1px solid #000 !important; background: transparent !important; }
          .print-bar { background: black !important; }

          /* Permitir que la tabla se divida entre hojas */
          .print-table-container {
            page-break-inside: auto !important;
          }
          
          .print-table { width: 100% !important; border-collapse: collapse !important; }
          .print-table th, .print-table td { 
            border: 1px solid #000 !important; 
            padding: 0.5rem !important; 
            color: black !important;
          }
          .print-table-header { background: #f0f0f0 !important; }
          .print-table-body tr { page-break-inside: avoid; }
        }
      `}} />
    
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

</div>
  );
}
