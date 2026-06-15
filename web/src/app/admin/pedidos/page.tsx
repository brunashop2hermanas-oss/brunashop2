"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, CheckCircle, XCircle, Printer, MessageCircle, Star, PackageCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { getVentas, updateEstadoVenta, toggleEmpaquetado } from "@/app/actions/ventas";

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null); // Modal de Verificación de Pago
  const [pedidoEmpaquetando, setPedidoEmpaquetando] = useState<any>(null); // Modal de Empaquetado
  const [pedidosParaImprimir, setPedidosParaImprimir] = useState<string[]>([]);
  const [filtroTab, setFiltroTab] = useState<'pendientes' | 'completados'>('pendientes');

  // Función para obtener pedidos de la base de datos
  const fetchPedidos = async () => {
    const res = await getVentas();
    if (res.success) {
      setPedidos(res.data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPedidos();
    
    // Polling cada 5 segundos para actualización en tiempo real
    const intervalo = setInterval(fetchPedidos, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // Función para abrir WhatsApp
  const enviarWhatsApp = (celular: string, mensaje: string) => {
    const numeroFormateado = celular.startsWith("591") ? celular : `591${celular}`;
    const url = `https://wa.me/${numeroFormateado}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  const aprobarPago = async (pedido: any) => {
    const res = await updateEstadoVenta(pedido.id, 'Aprobado');
    if (res.success) {
      // Actualización optimista local
      const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: "Aprobado" } : p);
      setPedidos(nuevosPedidos);
      setPedidoSeleccionado(null);
      
      const mensaje = `¡Hola ${pedido.cliente}! Somos BrunaShop2 ✨. Tu pago por Bs. ${pedido.total.toFixed(2)} ha sido VERIFICADO exitosamente ✅. Tu pedido ya está en preparación para ser enviado a la terminal de ${pedido.destino}. Te avisaremos apenas lo despachemos. ¡Gracias por tu compra!`;
      enviarWhatsApp(pedido.celular, mensaje);
    } else {
      alert("Error al aprobar pago");
    }
  };

  const rechazarPago = async (pedido: any) => {
    const res = await updateEstadoVenta(pedido.id, 'Rechazado');
    if (res.success) {
      const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: "Rechazado" } : p);
      setPedidos(nuevosPedidos);
      setPedidoSeleccionado(null);

      const mensaje = `¡Hola ${pedido.cliente}! Somos BrunaShop2. Tuvimos un inconveniente al verificar tu comprobante de pago por Bs. ${pedido.total.toFixed(2)} ❌. Por favor, ¿podrías enviarnos la imagen del comprobante por este medio para revisar qué pasó? Quedamos atentas.`;
      enviarWhatsApp(pedido.celular, mensaje);
    } else {
      alert("Error al rechazar pago");
    }
  };

  const imprimirVineta = (pedido: any) => {
    sessionStorage.setItem("pedidosAImprimir", JSON.stringify([pedido]));
    window.open(`/imprimir`, '_blank');
  };

  const imprimirSeleccionados = () => {
    const aImprimir = pedidos.filter(p => pedidosParaImprimir.includes(p.id));
    sessionStorage.setItem("pedidosAImprimir", JSON.stringify(aImprimir));
    window.open(`/imprimir`, '_blank');
  };

  const toggleSeleccion = (id: string) => {
    if (pedidosParaImprimir.includes(id)) {
      setPedidosParaImprimir(pedidosParaImprimir.filter(pid => pid !== id));
    } else {
      setPedidosParaImprimir([...pedidosParaImprimir, id]);
    }
  };

  const handleToggleEmpaquetado = async (pedidoId: string, articulo: any) => {
    const res = await toggleEmpaquetado(articulo.id, articulo.empaquetado);
    if (res.success) {
      // Actualización optimista local
      const nuevosPedidos = pedidos.map(p => {
        if (p.id === pedidoId) {
          return {
            ...p,
            articulos: (p.articulos || []).map((art: any) => art.id === articulo.id ? { ...art, empaquetado: !art.empaquetado } : art)
          };
        }
        return p;
      });
      setPedidos(nuevosPedidos);
      
      const updatedPedido = nuevosPedidos.find(p => p.id === pedidoId);
      if (updatedPedido) setPedidoEmpaquetando(updatedPedido);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Gestión de Pedidos</h1>
          <p className="text-foreground/70">Verifica comprobantes y prepara envíos.</p>
        </div>
        
        {/* Pestañas (Tabs) */}
        <div className="flex bg-surface border border-surface-border p-1 rounded-xl">
          <button 
            onClick={() => setFiltroTab('pendientes')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filtroTab === 'pendientes' ? 'bg-brand-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Pendientes de Empaque
          </button>
          <button 
            onClick={() => setFiltroTab('completados')}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${filtroTab === 'completados' ? 'bg-green-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Listos / Completados
          </button>
        </div>

        {pedidosParaImprimir.length > 0 && (
          <button 
            onClick={imprimirSeleccionados}
            className="bg-brand-primary text-white px-6 py-3 rounded-full font-bold shadow-xl hover:bg-brand-accent transition-colors flex items-center gap-2 animate-bounce"
          >
            <Printer className="w-5 h-5" /> Imprimir {pedidosParaImprimir.length} Viñetas
          </button>
        )}
      </div>

      {/* Tabla de Pedidos */}
      <div className="glass rounded-3xl overflow-hidden border border-surface-border shadow-3d">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-surface-border text-foreground/80 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-10"></th>
                <th className="p-4 font-semibold">ID Pedido</th>
                <th className="p-4 font-semibold">Origen</th>
                <th className="p-4 font-semibold">Prendas a Enviar</th>
                <th className="p-4 font-semibold">Clienta</th>
                <th className="p-4 font-semibold">Destino</th>
                <th className="p-4 font-semibold">Total (Bs)</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {pedidos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-foreground/50 font-medium">
                    No hay pedidos registrados todavía.
                  </td>
                </tr>
              ) : pedidos.filter(pedido => {
                const arts = pedido.articulos || [];
                const todasEmpaquetadas = arts.length > 0 && arts.every((art: any) => art.empaquetado);
                if (filtroTab === 'pendientes') return !todasEmpaquetadas;
                if (filtroTab === 'completados') return todasEmpaquetadas;
                return true;
              }).map((pedido) => (
                <tr key={pedido.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    {pedido.estado !== 'Rechazado' && (
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                        checked={pedidosParaImprimir.includes(pedido.id)}
                        onChange={() => toggleSeleccion(pedido.id)}
                      />
                    )}
                  </td>
                  <td className="p-4 font-mono font-medium text-brand-primary">{pedido.id.slice(-6).toUpperCase()}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-start">
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-bold mb-1 ${pedido.origen === 'WEB' ? 'bg-blue-500/20 text-blue-500' : (pedido.origen === 'CAJA' || pedido.origen === 'POS') ? 'bg-purple-500/20 text-purple-500' : 'bg-pink-500/20 text-pink-500'}`}>
                        {pedido.origen === 'POS' ? 'CAJA' : pedido.origen}
                      </div>
                      {pedido.registradoPor ? (
                        <div className="text-sm font-bold text-foreground mt-1 bg-surface-border/50 px-2 py-1 rounded-md">
                          Atendido por: <span className="text-brand-primary">{pedido.registradoPor}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-foreground/50 mt-1 italic">Automático (Web)</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {(() => {
                      const arts = pedido.articulos || [];
                      const todasEmpaquetadas = arts.length > 0 && arts.every((art: any) => art.empaquetado);
                      
                      return (
                        <button 
                          onClick={() => setPedidoEmpaquetando(pedido)}
                          className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors flex flex-col items-center justify-center w-full gap-1 border shadow-sm ${
                            todasEmpaquetadas 
                            ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500 hover:text-white'
                            : 'bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                          }`}
                        >
                          {todasEmpaquetadas ? (
                            <><CheckCircle className="w-5 h-5" /> Listo (Ver)</>
                          ) : (
                            <><PackageCheck className="w-5 h-5" /> Pendiente ({arts.filter((a:any) => a.empaquetado).length}/{arts.length})</>
                          )}
                        </button>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="font-bold text-foreground">{pedido.cliente}</div>
                    <div className="text-xs text-foreground/60 flex items-center gap-1 mt-0.5">
                      <MessageCircle className="w-3 h-3" /> {pedido.celular}
                    </div>
                    <div className="text-xs font-mono text-foreground/50 mt-0.5">
                      CI: {pedido.ci}
                    </div>
                  </td>
                  <td className="p-4 text-foreground/90">{pedido.destino}</td>
                  <td className="p-4 font-bold text-foreground">{pedido.total.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pedido.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                      pedido.estado === 'Aprobado' ? 'bg-green-500/20 text-green-500 border border-green-500/50' :
                      'bg-red-500/20 text-red-500 border border-red-500/50'
                    }`}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    {pedido.estado === 'Pendiente' && (
                      <button 
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors shadow-md"
                        title="Ver Comprobante"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}
                    {pedido.estado !== 'Rechazado' && (
                      <button 
                        onClick={() => imprimirVineta(pedido)}
                        className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md border border-slate-600 flex-shrink-0"
                        title="Imprimir Viñeta"
                      >
                        <Printer className="w-5 h-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Verificación de Comprobante */}
      <AnimatePresence>
        {pedidoSeleccionado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPedidoSeleccionado(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-surface border border-surface-border p-6 rounded-3xl shadow-2xl max-w-lg w-full z-10 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Verificar Pago: {pedidoSeleccionado.id.slice(-6).toUpperCase()}</h2>
              <div className="bg-background rounded-xl p-4 mb-6 flex justify-between items-center border border-surface-border">
                <div>
                  <p className="text-sm text-foreground/70">Monto a verificar:</p>
                  <p className="text-3xl font-black text-green-500">Bs. {pedidoSeleccionado.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">{pedidoSeleccionado.cliente}</p>
                  <p className="text-sm text-foreground/70">CI: {pedidoSeleccionado.ci}</p>
                </div>
              </div>

              {/* Imagen del Comprobante */}
              <div className="flex-1 overflow-auto bg-black rounded-xl mb-6 flex items-center justify-center relative group min-h-[300px]">
                <img 
                  src={pedidoSeleccionado.comprobanteUrl} 
                  alt="Comprobante" 
                  className="max-w-full max-h-full object-contain rounded-xl"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">Foto subida por clienta</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => rechazarPago(pedidoSeleccionado)}
                  className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" /> Rechazar
                </button>
                <button 
                  onClick={() => aprobarPago(pedidoSeleccionado)}
                  className="py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Aprobar Pago
                </button>
              </div>
              <p className="text-xs text-center text-foreground/50 mt-4">
                * Al presionar cualquier botón, se abrirá WhatsApp Web para notificar a la clienta.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Empaquetado */}
      <AnimatePresence>
        {pedidoEmpaquetando && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setPedidoEmpaquetando(null)}
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-surface border border-surface-border p-6 rounded-3xl shadow-2xl max-w-2xl w-full z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Lista de Empaque</h2>
                  <p className="text-foreground/60 text-sm">Pedido: <span className="font-mono text-brand-primary font-bold">{pedidoEmpaquetando.id.slice(-6).toUpperCase()}</span> - {pedidoEmpaquetando.cliente}</p>
                </div>
                <button onClick={() => setPedidoEmpaquetando(null)} className="p-2 hover:bg-surface-border rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-foreground/50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {(pedidoEmpaquetando.articulos || []).map((art: any) => (
                  <div key={art.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${art.empaquetado ? 'bg-green-500/10 border-green-500/30' : 'bg-background border-surface-border'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${art.empaquetado ? 'bg-green-500 text-white' : 'bg-surface border border-surface-border'}`}>
                        {art.empaquetado ? <CheckCircle className="w-6 h-6" /> : '👗'}
                      </div>
                      <div>
                        <h4 className={`font-bold ${art.empaquetado ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground'}`}>{art.nombre}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Cant: {art.cantidad}</span>
                          <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Talla: {art.talla}</span>
                          <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Color: {art.color}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleEmpaquetado(pedidoEmpaquetando.id, art)}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 ${
                        art.empaquetado 
                        ? 'bg-green-500 text-white border-b-4 border-green-700 hover:brightness-110 active:border-b-0 active:translate-y-1' 
                        : 'bg-surface border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white'
                      }`}
                    >
                      {art.empaquetado ? (
                        <>Empaquetado <CheckCircle className="w-4 h-4" /></>
                      ) : (
                        <>Empaquetar <PackageCheck className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-surface-border">
                <button 
                  onClick={() => setPedidoEmpaquetando(null)}
                  className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg hover:brightness-110 transition-colors"
                >
                  Cerrar Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
