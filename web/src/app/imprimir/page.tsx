"use client";

import { useEffect, useState } from "react";

export default function ImprimirVineta() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Recuperar pedidos seleccionados de sessionStorage
    const guardados = sessionStorage.getItem("pedidosAImprimir");
    if (guardados) {
      setPedidos(JSON.parse(guardados));
    } else {
      // Fallback por si entran directo
      setPedidos([{
        id: "BRN-000",
        cliente: "Nombre de Clienta",
        ci: "0000000",
        celular: "00000000",
        destino: "Ciudad"
      }]);
    }

    setMounted(true);
    // Disparar la ventana de impresión automáticamente después de 1 segundo
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white min-h-screen text-black font-sans print-container">
      {/* Estilos específicos para forzar cuadrícula de 4 por hoja (2x2) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: letter;
            margin: 0.5cm;
          }
          body {
            background: white;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
        
        .hoja-impresion {
          display: grid;
          grid-template-columns: 1fr 1fr; /* 2 columnas */
          grid-auto-rows: 13.97cm; /* Altura de media carta */
          gap: 0;
          width: 21.59cm; /* Ancho carta */
          margin: 0 auto;
        }

        .vineta {
          border: 1px dashed #ccc;
          padding: 1cm;
          box-sizing: border-box;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
        }
        
        @media print {
          .hoja-impresion {
            width: 100%;
          }
        }
      `}} />

      <div className="p-8 no-print bg-gray-100 mb-8 border-b text-center">
        <h1 className="text-2xl font-bold mb-2">Impresión en Lote (4 por hoja)</h1>
        <p className="mb-4">El diálogo de impresión debería abrirse automáticamente. Se imprimirán en formato 2x2.</p>
        <button onClick={() => window.print()} className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold shadow-lg">
          Imprimir de nuevo
        </button>
      </div>

      <div className="flex justify-center bg-white">
        <div className="hoja-impresion">
          {pedidos.map((pedido, index) => (
            <div key={index} className="vineta relative bg-white overflow-hidden">
              {/* Cabecera / Logo */}
              <div className="flex items-center gap-4 mb-4 border-b-2 border-black pb-2">
                <img src="/logo.png" alt="BrunaShop2" className="w-12 h-12 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">BrunaShop2</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Tienda Online</p>
                </div>
              </div>

              {/* Datos del Envío */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Destinatario / Clienta</p>
                  <p className="text-lg font-black uppercase leading-tight line-clamp-2">{pedido.cliente}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">C.I.</p>
                    <p className="text-sm font-bold">{pedido.ci}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Celular</p>
                    <p className="text-sm font-bold">{pedido.celular}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Destino</p>
                  <p className="text-xl font-black uppercase tracking-wider border-2 border-black inline-block px-2 py-0.5 bg-gray-100">{pedido.destino}</p>
                </div>
              </div>

              {/* Pie de Viñeta - Transportadora */}
              <div className="mt-auto pt-2 border-t border-dashed border-gray-400">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-4 font-bold">Empresa de Transporte (Flota)</p>
                <div className="w-full border-b border-black h-4"></div>
                <div className="flex justify-between items-end mt-2">
                   <p className="text-[8px] text-gray-400 font-mono">ID: {pedido.id}</p>
                   <p className="text-[8px] text-gray-400 font-bold">FRÁGIL</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
