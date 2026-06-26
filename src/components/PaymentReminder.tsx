"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentReminder() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isSimulation = typeof window !== 'undefined' && window.location.search.includes('simular_alarma=true');
    const dismissedKey = `payment_reminder_dismissed_${new Date().getMonth()}_${new Date().getFullYear()}`;
    
    if (localStorage.getItem(dismissedKey) && !isSimulation) {
      return;
    }

    const today = new Date();
    const day = today.getDate();
    // 5 días antes del 25, es decir, del 20 al 25.
    if ((day >= 20 && day <= 25) || isSimulation) {
      setIsVisible(true);
    }
  }, []);

  const dismiss = () => {
    const dismissedKey = `payment_reminder_dismissed_${new Date().getMonth()}_${new Date().getFullYear()}`;
    localStorage.setItem(dismissedKey, "true");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-md z-50 print:hidden overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-white/20 rounded-full shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-xs tracking-widest uppercase mb-0.5">Recordatorio de Pago</p>
                <p className="text-xs text-white/90">
                  Tus planes de <strong>Supabase (Base de datos)</strong> y <strong>Render (Servidor)</strong> se debitan automáticamente cada 25 de mes. Por favor, asegúrate de contar con saldo en tu tarjeta para evitar suspensiones de la tienda.
                </p>
              </div>
            </div>
            <button 
              onClick={dismiss}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors shrink-0"
              title="Entendido (Ocultar por este mes)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
