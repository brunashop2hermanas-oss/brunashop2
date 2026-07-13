"use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { checkLiveNotificationsStatus } from "@/app/actions/notificaciones";
import { AlertCircle, Smartphone } from "lucide-react";

export default function LiveNotifications() {
  const checkedRef = useRef(false);
  const lastLiveCountRef = useRef(0);
  const toastIdRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Mostrar el aviso del QR siempre que se inicie sesión (solo una vez)
    const hasShownQRReminder = sessionStorage.getItem("hasShownQRReminder_v2");
    
    if (!hasShownQRReminder) {
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="font-medium">
              Por favor, recuerda actualizar tu código QR de cobro siempre que tengas prendas en Live.
            </span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                sessionStorage.setItem("hasShownQRReminder_v2", "true");
              }}
              className="self-end mt-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-semibold transition-colors"
            >
              Aceptar
            </button>
          </div>
        ),
        {
          duration: Infinity,
          icon: <Smartphone className="w-5 h-5 text-blue-500 flex-shrink-0" />,
          style: {
            border: '1px solid #BFDBFE',
            padding: '16px',
            color: '#1E3A8A',
            backgroundColor: '#EFF6FF',
            maxWidth: '400px'
          },
        }
      );
    }

    // 2. Verificar continuamente si hay prendas en Live pero el botón maestro está apagado
    const checkMasterStatus = async () => {
      const status = await checkLiveNotificationsStatus();
      
      if (status.needsMasterButtonReminder) {
        // Leer el último conteo desde sessionStorage en lugar de useRef para que sobreviva la navegación
        const storedLastCount = parseInt(sessionStorage.getItem("lastLiveCount") || "0", 10);
        
        // Si el conteo de prendas en live aumentó, forzamos a que vuelva a salir la notificación
        if (status.liveCount > storedLastCount) {
          sessionStorage.removeItem("hasShownMasterReminder_v2");
        }
        
        sessionStorage.setItem("lastLiveCount", status.liveCount.toString());
        
        const hasShownMasterReminder = sessionStorage.getItem("hasShownMasterReminder_v2");
        
        if (!hasShownMasterReminder && !toastIdRef.current) {
          const newToastId = toast(
            (t) => (
              <div className="flex flex-col gap-2">
                <span className="font-medium">
                  Tienes prendas con la opción de Live activada, pero tus clientas no las verán porque el botón maestro de TikTok está apagado en Configuración.
                </span>
                <button
                  onClick={() => {
                    toast.dismiss(t.id);
                    sessionStorage.setItem("hasShownMasterReminder_v2", "true");
                    toastIdRef.current = null;
                  }}
                  className="self-end mt-1 px-3 py-1 bg-yellow-200 text-yellow-800 hover:bg-yellow-300 rounded-md text-sm font-semibold transition-colors"
                >
                  Entendido
                </button>
              </div>
            ),
            {
              duration: Infinity,
              icon: <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />,
              style: {
                border: '1px solid #FEF08A',
                padding: '16px',
                color: '#854D0E',
                backgroundColor: '#FEF9C3',
                maxWidth: '450px'
              },
            }
          );
          toastIdRef.current = newToastId;
        }
      } else {
        // Si ya no se necesita el recordatorio (porque activó el maestro o quitó las prendas),
        // lo desaparecemos automáticamente y reiniciamos el flag y el contador.
        sessionStorage.setItem("lastLiveCount", "0");
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current);
          toastIdRef.current = null;
        }
        sessionStorage.removeItem("hasShownMasterReminder_v2");
      }
    };

    checkMasterStatus();
    const interval = setInterval(checkMasterStatus, 5000); // Revisar cada 5 segundos
    
    return () => clearInterval(interval);
  }, []);

  return null; // Este componente no renderiza nada visible directamente
}
