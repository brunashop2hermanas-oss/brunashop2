"use client";

import { motion } from "framer-motion";
import { Star, Gift, Search, Phone, Fingerprint, FileText } from "lucide-react";
import { useState } from "react";

import { getClientas } from "@/app/actions/clientas";
import { useEffect } from "react";

export default function AdminClientas() {
  const [busqueda, setBusqueda] = useState("");
  const [clientas, setClientas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientaSeleccionada, setClientaSeleccionada] = useState<any>(null);
  const [criterioOrden, setCriterioOrden] = useState<"defecto" | "puntos">("defecto");

  useEffect(() => {
    const fetchClientas = async () => {
      const res = await getClientas();
      if (res.success) {
        setClientas(res.data || []);
      }
      setIsLoading(false);
    };
    fetchClientas();
  }, []);

  const handleImprimirClienta = (clienta: any) => {
    setClientaSeleccionada(clienta);
    setTimeout(() => {
      window.print();
      // Opcional: resetear después de un rato, pero no hace daño dejarlo ahí oculto.
    }, 100);
  };

  const clientasFiltradas = clientas.filter(c => 
    (c.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || 
    (c.ci || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.celular || "").includes(busqueda)
  ).sort((a, b) => {
    if (criterioOrden === "puntos") {
      return b.prendasCompradas - a.prendasCompradas;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* VISTA PRINCIPAL (SE OCULTA EN PDF SI HAY CLIENTA SELECCIONADA) */}
      <div className={clientaSeleccionada ? "print-hidden-main" : ""}>
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            Clientas VIP
          </h1>
          <p className="text-foreground/70 mt-1 text-lg">
            Directorio de clientas frecuentes y acumulación de puntos (1 Prenda = 1 Punto).
          </p>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setCriterioOrden("defecto")}
          className={`glass p-6 rounded-3xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${criterioOrden === "defecto" ? 'border-4 border-brand-primary bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 ring-4 ring-brand-primary/50 shadow-[0_0_40px_10px_#D49A9A] scale-[1.02] z-10 relative' : 'border border-surface-border shadow-lg hover:border-brand-primary hover:shadow-xl'}`}
        >
          <div className="bg-brand-primary p-4 rounded-full text-background">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-foreground/70 font-medium text-sm uppercase tracking-wider">Total Clientas</p>
            <p className="text-3xl font-black text-foreground">{isLoading ? "..." : clientas.length}</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setCriterioOrden("puntos")}
          className={`glass p-6 rounded-3xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${criterioOrden === "puntos" ? 'border-4 border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 ring-4 ring-yellow-500/50 shadow-[0_0_40px_10px_#eab308] scale-[1.02] z-10 relative' : 'border border-surface-border shadow-lg hover:border-yellow-500 hover:shadow-xl'}`}
        >
          <div className="bg-yellow-500 p-4 rounded-full text-white">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <p className="text-foreground/70 font-medium text-sm uppercase tracking-wider">Top Clienta</p>
            <p className="text-2xl font-bold text-foreground truncate">Ranking por Puntos</p>
          </div>
        </motion.div>
      </div>

      {/* Buscador y Tabla */}
      <div className="bg-surface border border-surface-border rounded-3xl shadow-3d overflow-hidden">
        
        {/* Barra de Búsqueda */}
        <div className="p-6 border-b border-surface-border bg-surface/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, CI o celular..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-background border border-surface-border pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all"
            />
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="bg-background/50 border-b border-surface-border text-foreground/70 uppercase text-xs font-bold tracking-wider">
                <th className="p-5">Clienta</th>
                <th className="p-5">Identidad / Envío</th>
                <th className="p-5 text-center">Pedidos Totales</th>
                <th className="p-5 text-right">Gasto Histórico</th>
                <th className="p-5 text-center">Puntos (Prendas)</th>
                <th className="p-5 text-center no-print">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : clientasFiltradas.length > 0 ? (
                clientasFiltradas.map((clienta) => (
                  <tr key={clienta.id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-foreground text-lg">{clienta.nombre}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-foreground/80 font-medium">
                          <Fingerprint className="w-4 h-4 text-brand-primary" />
                          {clienta.ci || "Sin CI"}
                        </div>
                        <a 
                          href={`https://wa.me/${clienta.celular?.startsWith("591") ? clienta.celular : `591${clienta.celular}`}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-foreground/80 font-medium hover:text-brand-primary hover:underline cursor-pointer"
                        >
                          <Phone className="w-4 h-4 text-brand-primary" />
                          {clienta.celular || "Sin Celular"}
                        </a>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className="font-black text-foreground text-lg">{clienta.totalPedidos}</span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-bold text-brand-primary text-lg">Bs. {clienta.dineroGastado.toFixed(2)}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-4 py-2 rounded-xl font-black text-lg">
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        {clienta.prendasCompradas}
                      </div>
                    </td>
                    <td className="p-5 text-center no-print">
                      <button 
                        onClick={() => handleImprimirClienta(clienta)}
                        className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 mx-auto"
                      >
                        <FileText className="w-4 h-4" /> PDF
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-foreground/50 font-medium">
                    {clientas.length === 0 ? "Todavía no hay clientas registradas." : "No se encontró ninguna clienta con esos datos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Vista Móvil (Tarjetas) */}
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : clientasFiltradas.length > 0 ? (
            clientasFiltradas.map((clienta) => (
              <div key={clienta.id} className="bg-surface border border-surface-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-surface-border pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight">{clienta.nombre}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
                        <Fingerprint className="w-4 h-4 text-brand-primary" />
                        {clienta.ci || "Sin CI"}
                      </div>
                      <a 
                        href={`https://wa.me/${clienta.celular?.startsWith("591") ? clienta.celular : `591${clienta.celular}`}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground/80 text-sm font-medium hover:text-brand-primary hover:underline cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-brand-primary" />
                        {clienta.celular || "Sin Celular"}
                      </a>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs uppercase tracking-widest text-foreground/50 font-bold">Puntos</span>
                    <div className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-2 py-1 rounded-lg font-black text-sm">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {clienta.prendasCompradas}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-background/50 p-3 rounded-lg border border-surface-border">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Pedidos</p>
                    <p className="font-black text-foreground">{clienta.totalPedidos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Gastado</p>
                    <p className="font-bold text-brand-primary">Bs. {clienta.dineroGastado.toFixed(2)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleImprimirClienta(clienta)}
                  className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 mt-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full"
                >
                  <FileText className="w-4 h-4" /> Ver / Imprimir PDF
                </button>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-foreground/50 font-medium bg-surface rounded-xl">
              {clientas.length === 0 ? "Todavía no hay clientas registradas." : "No se encontró ninguna clienta con esos datos."}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-background/50 border-t border-surface-border text-center text-sm font-medium text-foreground/60 no-print">
          Tip: Úsala durante tus Lives. Si una clienta tiene muchos puntos, ¡mándale un regalito sorpresa en su próximo envío!
        </div>
      </div>
      </div> {/* FIN DE LA VISTA PRINCIPAL */}

      {/* FICHA TÉCNICA DE CLIENTE (OCULTA EN PANTALLA, VISIBLE EN PDF) */}
      {clientaSeleccionada && (
        <div className="hidden print-ficha w-full">
          {/* Cabecera Oficial */}
          <div className="border-b-2 border-black pb-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="BrunaShop2" className="w-16 h-16 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-black">BrunaShop2</h1>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ficha de Clienta Frecuente</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-black">Fecha de Impresión: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
                <p className="text-sm font-bold text-black">ID Sistema: <span className="font-normal">CLI-{clientaSeleccionada.id.toString().padStart(4, '0')}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border border-black p-6 rounded-xl">
              <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Datos Personales</h2>
              <p className="text-2xl font-black text-black uppercase mb-4">{clientaSeleccionada.nombre}</p>
              <div className="space-y-2">
                <p className="text-black font-bold">Carnet de Identidad: <span className="font-normal">{clientaSeleccionada.ci}</span></p>
                <p className="text-black font-bold">Celular / WhatsApp: <a href={`https://wa.me/${clientaSeleccionada.celular?.startsWith("591") ? clientaSeleccionada.celular : `591${clientaSeleccionada.celular}`}`} target="_blank" rel="noopener noreferrer" className="font-normal text-blue-600 hover:underline">{clientaSeleccionada.celular}</a></p>
              </div>
            </div>
            
            <div className="border border-black p-6 rounded-xl bg-gray-50">
              <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Resumen de Compras</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Pedidos Totales</p>
                  <p className="text-3xl font-black text-black">{clientaSeleccionada.totalPedidos}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Gasto Histórico</p>
                  <p className="text-3xl font-black text-black">Bs. {clientaSeleccionada.dineroGastado.toFixed(2)}</p>
                </div>
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-bold uppercase text-gray-500">Puntos Acumulados (Prendas)</p>
                  <p className="text-4xl font-black text-black flex items-center gap-2">
                    ★ {clientaSeleccionada.prendasCompradas} PUNTOS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historial Detallado de Compras */}
          <div className="border border-black p-6 rounded-xl mb-8">
            <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Historial Detallado de Compras</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500">Fecha y Hora</th>
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500">Prenda Adquirida</th>
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500 text-right">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {clientaSeleccionada.compras && clientaSeleccionada.compras.length > 0 ? (
                  clientaSeleccionada.compras.map((compra: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-black">
                        <span className="font-bold">{compra.fecha}</span> <br/>
                        <span className="text-xs text-gray-500">{compra.hora}</span>
                      </td>
                      <td className="py-3 text-sm font-bold text-black">{compra.prenda}</td>
                      <td className="py-3 text-sm font-black text-black text-right">{compra.monto.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-sm text-gray-500">No hay compras registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* Firmas Oficiales para PDF */}
          <div className="mt-12 break-inside-avoid">
            <div className="flex justify-around">
              <div className="text-center">
                <div className="w-48 border-b-2 border-black mb-2 mx-auto"></div>
                <p className="font-bold text-sm text-black">Firma Encargada</p>
                <p className="text-xs text-gray-500">BrunaShop2</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
          
          /* Ocultar la pantalla principal si estamos imprimiendo ficha */
          .print-hidden-main { display: none !important; }
          
          /* Mostrar Ficha */
          .print-ficha { display: block !important; }
        }
      `}} />
    </div>
  );
}
