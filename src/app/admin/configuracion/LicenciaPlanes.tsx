"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Calendar, Star, Zap, ShieldCheck, ExternalLink, X, RefreshCw } from "lucide-react";
import { getConfiguracion, actualizarPlanSupabase } from "@/app/actions/config";
import toast from "react-hot-toast";

export default function LicenciaPlanes() {
  const [showPlanesModal, setShowPlanesModal] = useState(false);
  const [planActual, setPlanActual] = useState("Gratuito");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConf = async () => {
      const res = await getConfiguracion();
      if (res.success && res.data) {
        setPlanActual(res.data.planSupabase || "Gratuito");
      }
      setLoading(false);
    };
    fetchConf();
  }, []);

  const esPlanDePago = planActual !== "Gratuito";

  // Fecha de vencimiento (solo aplica si es plan de pago)
  const fechaVencimiento = new Date();
  fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
  fechaVencimiento.setDate(0); // Último día del mes actual

  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  const alertaVencimiento = esPlanDePago && diasRestantes <= 5;

  const planes = [
    {
      nombre: "Gratuito",
      precio: "$0",
      frecuencia: "para siempre",
      caracteristicas: ["500 MB Base de Datos", "1 GB Almacenamiento", "Pausa tras inactividad", "Soporte comunitario"],
      color: "bg-gray-100 text-gray-700",
      recomendado: false
    },
    {
      nombre: "Pro",
      precio: "$25",
      frecuencia: "/ mes",
      caracteristicas: ["8 GB Base de Datos", "100 GB Almacenamiento", "Sin pausa por inactividad", "Copias de seguridad diarias"],
      color: "bg-green-50 text-green-700 border-green-200",
      recomendado: true
    }
  ];

  const marcarPlanPagado = async (plan: string) => {
    toast.loading("Actualizando configuración...");
    const res = await actualizarPlanSupabase(plan);
    toast.dismiss();
    if (res.success) {
      setPlanActual(plan);
      toast.success("¡Plan actualizado en el sistema! Recarga la página para ver los nuevos límites.");
    } else {
      toast.error("Error al actualizar el plan.");
    }
  };

  const solicitarPlan = () => {
    // Redirige directamente a la página exacta de facturación de BrunaShop en Supabase
    window.open(`https://supabase.com/dashboard/org/gbbzmntbuvqrcuqsykql/billing`, "_blank");
  };

  return (
    <div className="bg-surface border border-surface-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6 mt-8">
      <div className="flex items-center gap-4 border-b border-surface-border pb-6">
        <div className="p-3 bg-green-500/10 rounded-2xl text-green-500">
          <CreditCard className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Almacenamiento en Supabase</h2>
          <p className="text-foreground/60 text-sm">Aumenta la capacidad de tu base de datos y de las imágenes alojadas en los servidores de Supabase.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solo mostrar próxima fecha de pago si ya tienen un plan activado */}
        {esPlanDePago ? (
          <div className={`p-6 rounded-2xl border ${alertaVencimiento ? 'bg-red-500/10 border-red-500/30' : 'bg-background border-surface-border'} flex flex-col justify-center`}>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className={`w-6 h-6 ${alertaVencimiento ? 'text-red-500' : 'text-foreground/70'}`} />
              <h3 className="font-bold uppercase tracking-widest text-xs text-foreground/70">Próximo Pago (Supabase)</h3>
            </div>
            <p className={`text-2xl font-black ${alertaVencimiento ? 'text-red-600' : 'text-foreground'}`}>
              {fechaVencimiento.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {alertaVencimiento ? (
              <p className="text-sm font-bold text-red-500 mt-2 flex items-center gap-1">
                <Zap className="w-4 h-4" /> ¡Atención! Tu plan vence en {diasRestantes} días.
              </p>
            ) : (
              <p className="text-sm text-foreground/50 mt-1">Faltan {diasRestantes} días para el cierre de ciclo.</p>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl border bg-background border-surface-border flex flex-col justify-center text-center items-center">
            <div className="p-3 bg-gray-500/10 rounded-full text-gray-500 mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground">Plan Gratuito Activo</h3>
            <p className="text-sm text-foreground/60 mt-1">No tienes fechas de pago pendientes.</p>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-primary/10 to-purple-500/10 border border-brand-primary/20 flex flex-col justify-center items-start relative">
          {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center"><RefreshCw className="w-6 h-6 animate-spin text-brand-primary" /></div>}
          <h3 className="font-bold uppercase tracking-widest text-xs text-brand-primary mb-2">Estado del Plan</h3>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-8 h-8 text-brand-primary" />
            <p className="text-3xl font-black text-foreground">{planActual}</p>
          </div>
          <button 
            onClick={() => setShowPlanesModal(true)}
            className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-brand-primary/30 flex justify-center items-center gap-2"
          >
            <Star className="w-5 h-5" /> Ampliar Almacenamiento
          </button>
        </div>
      </div>

      {/* Modal de Planes */}
      <AnimatePresence>
        {showPlanesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }} 
              className="bg-surface p-6 md:p-10 rounded-3xl shadow-2xl max-w-4xl w-full relative z-[101] max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowPlanesModal(false)}
                className="absolute top-4 right-4 p-2 bg-background rounded-full text-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-10">
                <h2 className="text-3xl font-black text-foreground mb-4">Mejora tu tienda, aumenta tus ventas</h2>
                <p className="text-foreground/70">Selecciona el plan que mejor se adapte al tamaño de tu negocio.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                {planes.map((plan, idx) => (
                  <div key={idx} className={`relative p-6 rounded-3xl border flex flex-col h-full ${plan.color} ${plan.recomendado ? 'border-2 scale-105 shadow-xl' : 'border-surface-border'}`}>
                    {plan.recomendado && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                        Recomendado
                      </div>
                    )}
                    
                    <h3 className="text-xl font-bold mb-2">{plan.nombre}</h3>
                    <div className="mb-6">
                      <span className="text-4xl font-black">{plan.precio}</span>
                      <span className="text-sm opacity-70 font-bold ml-1">{plan.frecuencia}</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.caracteristicas.map((carac, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2 text-sm font-medium">
                          <ShieldCheck className="w-5 h-5 shrink-0 opacity-70" />
                          <span>{carac}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => solicitarPlan()}
                        className={`w-full py-3 rounded-xl font-bold transition-all shadow-md flex justify-center items-center gap-2 ${
                          plan.recomendado 
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30' 
                            : plan.nombre === planActual 
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-white hover:bg-gray-50 text-purple-700 border border-purple-200'
                        }`}
                        disabled={plan.nombre === planActual}
                      >
                        {plan.nombre === planActual ? 'Tu plan actual' : 'Ir a pagar en Supabase'} <ExternalLink className="w-4 h-4" />
                      </button>

                      {plan.nombre !== planActual && plan.nombre !== "Gratuito" && (
                        <button 
                          onClick={() => marcarPlanPagado(plan.nombre)}
                          className="w-full py-2 text-xs font-bold text-gray-500 hover:text-green-600 underline flex justify-center items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Ya pagué este plan, actualizar en la tienda
                        </button>
                      )}
                      {plan.nombre !== planActual && plan.nombre === "Gratuito" && (
                        <button 
                          onClick={() => marcarPlanPagado("Gratuito")}
                          className="w-full py-2 text-xs font-bold text-gray-500 hover:text-red-500 underline flex justify-center items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Volver al plan Gratuito
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
