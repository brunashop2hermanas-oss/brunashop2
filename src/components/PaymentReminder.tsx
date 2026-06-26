"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentReminder() {
  const [isVisible, setIsVisible] = useState(false);
  const [fechaProximo, setFechaProximo] = useState<Date | null>(null);

  useEffect(() => {
    const isSimulation = typeof window !== 'undefined' && window.location.search.includes('simular_alarma=true');
    
    // Obtener fecha de próximo pago
    let proximoPagoStr = localStorage.getItem('fecha_proximo_pago_render');
    let fechaProximoPago: Date;
    
    if (proximoPagoStr) {
      fechaProximoPago = new Date(proximoPagoStr);
    } else {
      // Default: el 25 de este mes
      fechaProximoPago = new Date();
      if (fechaProximoPago.getDate() > 25) {
        fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
      }
      fechaProximoPago.setDate(25);
    }
    
    setFechaProximo(fechaProximoPago);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = Math.ceil((fechaProximoPago.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mostrar si faltan 5 días o menos, o si es simulación
    if ((diffTime <= 5 && diffTime >= 0) || isSimulation) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    setIsVisible(false);
  };

  const registrarPago = () => {
    const seguro = window.confirm("¿Está seguro de que ya realizó el pago de Supabase y Render?");
    if (!seguro) return;

    // Si presiona "Ya hice el pago", el próximo pago será exactamente en 1 mes desde el día que lo presionó
    const nuevoProximoPago = new Date();
    nuevoProximoPago.setMonth(nuevoProximoPago.getMonth() + 1);
    localStorage.setItem('fecha_proximo_pago_render', nuevoProximoPago.toISOString());
    setIsVisible(false);
    
    // Disparar un evento para que otras partes de la app se enteren si es necesario
    window.dispatchEvent(new Event('pago_actualizado'));
  };

  if (!fechaProximo) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md z-50 print:hidden overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-xs tracking-widest uppercase mb-0.5">Recordatorio de Pago ({fechaProximo.toLocaleDateString()})</p>
                <p className="text-xs text-white/90">
                  Tus planes de <strong>Supabase (Base de datos)</strong> y <strong>Render (Servidor)</strong> están próximos a vencer. Por favor, asegúrate de contar con saldo en tu tarjeta para evitar suspensiones de la tienda.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
              <button 
                onClick={registrarPago}
                className="bg-white text-red-600 hover:bg-red-50 font-bold text-xs px-4 py-2 rounded-full shadow-sm transition-colors flex items-center gap-2 flex-1 justify-center sm:flex-none"
              >
                <CheckCircle className="w-4 h-4" /> Ya hice el pago
              </button>
              <button 
                onClick={dismiss}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Cerrar aviso temporalmente"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
