"use client";

import { useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download } from "lucide-react";

export default function ImprimirVineta() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

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
  }, []);

  const descargarPDF = async () => {
    setGenerandoPdf(true);
    try {
      const element = document.querySelector('.hoja-impresion') as HTMLElement;
      if (element) {
        // Generar canvas de alta calidad (scale: 3) para que no se vea borroso
        const canvas = await html2canvas(element, { scale: 3, useCORS: true });
        const imgData = canvas.toDataURL("image/jpeg", 1.0);
        
        // Hoja carta es 215.9 x 279.4 mm
        const pdf = new jsPDF("p", "mm", "letter");
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Viñetas_BrunaShop_${new Date().getTime()}.pdf`);
      }
    } catch (err) {
      console.error("Error generando PDF:", err);
      alert("Hubo un error generando el PDF. Asegúrate de que no hayan imágenes rotas.");
    } finally {
      setGenerandoPdf(false);
    }
  };

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
          background: white;
        }

        .vineta {
          border: 1px dashed #ccc;
          padding: 1cm;
          box-sizing: border-box;
          page-break-inside: avoid;
          display: flex;
          flex-direction: column;
          background: white;
        }
        
        @media print {
          .hoja-impresion {
            width: 100%;
          }
        }
      `}} />

      <div className="p-8 no-print bg-gray-100 mb-8 border-b text-center">
        <h1 className="text-2xl font-bold mb-2">Impresión en Lote (4 por hoja)</h1>
        <p className="mb-6">Elige cómo quieres generar tus viñetas. Te recomendamos descargarlo en PDF directamente.</p>
        <div className="flex justify-center gap-6">
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-700 transition flex items-center gap-2">
            <Printer className="w-5 h-5"/> Imprimir (Normal)
          </button>
          
          <button 
            onClick={descargarPDF} 
            disabled={generandoPdf}
            className="bg-brand-primary text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:brightness-110 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5"/> {generandoPdf ? "Generando..." : "Descargar directamente en PDF"}
          </button>
        </div>
      </div>

      <div className="flex justify-center" style={{ backgroundColor: '#ffffff' }}>
        <div className="hoja-impresion">
          {pedidos.map((pedido, index) => (
            <div key={index} className="vineta relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
              {/* Cabecera / Logo */}
              <div className="flex items-center gap-4 mb-4 border-b-2 pb-2" style={{ borderColor: '#000000' }}>
                <img src="/logo.png" alt="BrunaShop2" className="w-12 h-12 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: '#000000' }}>BrunaShop2</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#6b7280' }}>Tienda Online</p>
                </div>
              </div>

              {/* Datos del Envío */}
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-0.5 font-bold" style={{ color: '#6b7280' }}>Destinatario / Clienta</p>
                  <p className="text-lg font-black uppercase leading-tight line-clamp-2" style={{ color: '#000000' }}>{pedido.cliente}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-0.5 font-bold" style={{ color: '#6b7280' }}>C.I.</p>
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{pedido.ci}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest mb-0.5 font-bold" style={{ color: '#6b7280' }}>Celular</p>
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>{pedido.celular}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-widest mb-0.5 font-bold" style={{ color: '#6b7280' }}>Ciudad / Municipio</p>
                  <p className="text-xl font-black uppercase tracking-wider border-2 inline-block px-2 py-0.5" style={{ borderColor: '#000000', backgroundColor: '#f3f4f6', color: '#000000' }}>{pedido.destino}</p>
                </div>
              </div>

              {/* Pie de Viñeta - Transportadora */}
              <div className="mt-auto pt-2 border-t border-dashed" style={{ borderColor: '#9ca3af' }}>
                <p className="text-[9px] uppercase tracking-widest mb-4 font-bold" style={{ color: '#6b7280' }}>Empresa de Transporte (Flota)</p>
                <div className="w-full border-b h-4" style={{ borderColor: '#000000' }}></div>
                <div className="flex justify-between items-end mt-2">
                   <p className="text-[8px] font-mono" style={{ color: '#9ca3af' }}>ID: {pedido.id}</p>
                   <p className="text-[8px] font-bold" style={{ color: '#9ca3af' }}>FRÁGIL</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
