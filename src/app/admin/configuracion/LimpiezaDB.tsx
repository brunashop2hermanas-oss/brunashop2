"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, AlertTriangle, Database, HardDrive, Calendar } from "lucide-react";
import { getEspacioUtilizado, limpiarBaseDeDatos } from "@/app/actions/limpieza";
import { getConfiguracion } from "@/app/actions/config";
import toast from "react-hot-toast";

// Helper para formatear bytes a MB/GB
function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function LimpiezaDB() {
  const [espacio, setEspacio] = useState<{dbSize: string, storageSize: string, fileCount: number, dbSizeBytes: number, storageSizeBytes: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const [limpiando, setLimpiando] = useState(false);
  const [planSupabase, setPlanSupabase] = useState("Gratuito");
  
  // Limites por defecto según plan de Supabase
  let MAX_DB_MB = 500;
  let MAX_STORAGE_MB = 1024; // 1 GB
  
  if (planSupabase === "Pro") {
    MAX_DB_MB = 8000; // 8 GB
    MAX_STORAGE_MB = 102400; // 100 GB
  }

  const MAX_DB_BYTES = MAX_DB_MB * 1024 * 1024;
  const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;
  
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  
  const [borrarComprobantes, setBorrarComprobantes] = useState(true);
  const [borrarGuias, setBorrarGuias] = useState(false);
  
  const [showWarningModal, setShowWarningModal] = useState(false);

  const cargarEspacio = async () => {
    const [res, conf] = await Promise.all([
      getEspacioUtilizado(),
      getConfiguracion()
    ]);
    
    if (conf?.data?.planSupabase) {
      setPlanSupabase(conf.data.planSupabase);
    }
    
    if (res.success && res.data) {
      setEspacio({
        dbSize: res.data.dbSize,
        storageSize: res.data.storageSize,
        fileCount: res.data.fileCount,
        dbSizeBytes: res.data.dbSizeBytes,
        storageSizeBytes: res.data.storageSizeBytes
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    // Para evitar la advertencia de setState síncrono
    const init = async () => {
      await cargarEspacio();
    };
    init();
  }, []);

  const preLimpiar = () => {
    if (!desde || !hasta) {
      toast.error("Por favor, selecciona un rango de fechas.");
      return;
    }
    if (!borrarComprobantes && !borrarGuias) {
      toast.error("Debes seleccionar al menos un tipo de archivo para limpiar.");
      return;
    }
    
    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);
    if (fechaDesde > fechaHasta) {
      toast.error("La fecha 'Desde' no puede ser mayor a 'Hasta'.");
      return;
    }

    setShowWarningModal(true);
  };

  const confirmarLimpieza = async () => {
    setShowWarningModal(false);
    setLimpiando(true);
    
    const res = await limpiarBaseDeDatos(new Date(desde), new Date(hasta), borrarComprobantes, borrarGuias);
    
    setLimpiando(false);
    if (res.success) {
      toast.success(res.message || "Limpieza completada");
      cargarEspacio(); // Refrescar indicadores
    } else {
      toast.error("Error: " + (res.error || "Desconocido"));
    }
  };

  return (
    <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-3xl shadow-xl space-y-8">
      <div className="flex items-center gap-4 border-b border-surface-border pb-6">
        <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
          <Database className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Limpieza y Almacenamiento</h2>
          <p className="text-foreground/60 text-sm">Libera espacio borrando archivos antiguos y pesados.</p>
        </div>
      </div>

      {/* Indicadores de Espacio */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-background border border-surface-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full text-blue-500"><HardDrive className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Base de Datos (Texto)</p>
              <p className="text-2xl font-black text-foreground">{loading ? "..." : espacio?.dbSize}</p>
            </div>
          </div>
          {!loading && espacio && (
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-foreground/70 mb-2 font-bold uppercase tracking-widest">
                <span>Usado: {espacio.dbSize}</span>
                <span>Libre: {formatBytes(MAX_DB_BYTES - espacio.dbSizeBytes)}</span>
              </div>
              <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min((espacio.dbSizeBytes / MAX_DB_BYTES) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-foreground/40 mt-1 text-right">Límite: {formatBytes(MAX_DB_BYTES, 0)}</p>
            </div>
          )}
        </div>
        
        <div className="bg-background border border-surface-border rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-full text-purple-500"><HardDrive className="w-6 h-6" /></div>
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">Imágenes (Supabase)</p>
              <p className="text-2xl font-black text-foreground">{loading ? "..." : espacio?.storageSize}</p>
              {!loading && <p className="text-xs text-foreground/50">{espacio?.fileCount} archivos encontrados</p>}
            </div>
          </div>
          {!loading && espacio && (
            <div className="w-full mt-2">
              <div className="flex justify-between text-xs text-foreground/70 mb-2 font-bold uppercase tracking-widest">
                <span>Usado: {espacio.storageSize}</span>
                <span>Libre: {formatBytes(MAX_STORAGE_BYTES - espacio.storageSizeBytes)}</span>
              </div>
              <div className="w-full bg-surface-border rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                  className={`h-2.5 rounded-full transition-all duration-1000 ${espacio.storageSizeBytes / MAX_STORAGE_BYTES > 0.8 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-purple-500'}`} 
                  style={{ width: `${Math.min((espacio.storageSizeBytes / MAX_STORAGE_BYTES) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-foreground/40 mt-1 text-right">Límite: {formatBytes(MAX_STORAGE_BYTES, 0)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de Limpieza */}
      <div className="bg-red-500/5 border border-red-500/20 p-6 md:p-8 rounded-2xl space-y-8">
        <div>
          <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5" /> Parámetros de Limpieza
          </h3>
          <p className="text-sm text-foreground/70 mb-6">
            Selecciona el rango de fechas. Solo se borrarán las imágenes (el peso); los registros de texto de tus ventas se mantendrán intactos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Desde (Inicio)</label>
            <input 
              type="date" 
              value={desde} 
              onChange={e => setDesde(e.target.value)}
              className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Calendar className="w-4 h-4"/> Hasta (Fin)</label>
            <input 
              type="date" 
              value={hasta} 
              onChange={e => setHasta(e.target.value)}
              className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-red-500/10">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-1">
              <input type="checkbox" checked={borrarComprobantes} onChange={e => setBorrarComprobantes(e.target.checked)} className="w-5 h-5 rounded text-red-500 focus:ring-red-500" />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-red-500 transition-colors">Borrar Comprobantes de Pago (QR/Transferencias)</p>
              <p className="text-xs text-foreground/60">Elimina las capturas de pantalla de pagos enviadas por las clientas.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-1">
              <input type="checkbox" checked={borrarGuias} onChange={e => setBorrarGuias(e.target.checked)} className="w-5 h-5 rounded text-red-500 focus:ring-red-500" />
            </div>
            <div>
              <p className="font-bold text-foreground group-hover:text-red-500 transition-colors">Borrar Fotos de Guías de Envío</p>
              <p className="text-xs text-foreground/60">Elimina las fotos que se subieron para confirmar envíos a terminal o por mensajería.</p>
            </div>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={preLimpiar}
            disabled={limpiando}
            className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-xl font-bold tracking-widest uppercase shadow-xl hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {limpiando ? "Limpiando..." : <><Trash2 className="w-5 h-5"/> Ejecutar Limpieza</>}
          </button>
        </div>
      </div>

      {/* Modal de Advertencia Extrema */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-background border border-red-500 p-8 rounded-3xl shadow-2xl max-w-md w-full relative z-[101]"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-center text-foreground mb-4">¡ACCIÓN IRREVERSIBLE!</h3>
              
              <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20 mb-6 text-sm text-foreground/80 space-y-3">
                <p>Estás a punto de borrar definitivamente las imágenes seleccionadas entre las fechas:</p>
                <p className="font-bold text-center text-red-500 text-lg">{desde} <span className="text-foreground text-sm font-normal">y</span> {hasta}</p>
                <p className="font-bold">Consecuencias:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Las imágenes de recibos o guías desaparecerán de tu base de datos para siempre.</li>
                  <li>No podrás recuperarlas.</li>
                  <li className="text-green-600 dark:text-green-400">Tus registros de texto y montos financieros <strong>NO se borrarán</strong>.</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmarLimpieza} 
                  className="w-full px-4 py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  SÍ, ESTOY TOTALMENTE SEGURA
                </button>
                <button 
                  onClick={() => setShowWarningModal(false)} 
                  className="w-full px-4 py-4 bg-surface text-foreground font-bold rounded-xl hover:bg-surface-border transition-colors border border-surface-border"
                >
                  No, cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
