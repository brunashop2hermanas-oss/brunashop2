"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, CheckCircle, XCircle, Printer, MessageCircle, Star, PackageCheck, Download, X, Upload } from "lucide-react";
import { useState, useEffect } from "react";
import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio } from "@/app/actions/ventas";
import { uploadImage } from "@/app/actions/upload";
import { compressImage } from "@/lib/imageCompression";
import toast from "react-hot-toast";

// Función para forzar descarga directa de imágenes en lugar de abrir pestaña
const forceDownload = async (url: string, filename: string) => {
  try {
    toast.loading("Preparando descarga...", { id: "descarga" });
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
    toast.success("Descarga iniciada", { id: "descarga" });
  } catch (err) {
    toast.error("No se pudo forzar descarga. Abriendo...", { id: "descarga" });
    window.open(url, '_blank');
  }
};

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null); // Modal de Verificación de Pago
  const [pedidoEmpaquetando, setPedidoEmpaquetando] = useState<any>(null); // Modal de Empaquetado
  const [pedidosParaImprimir, setPedidosParaImprimir] = useState<string[]>([]);
  const [filtroTab, setFiltroTab] = useState<'pagos' | 'empaquetar' | 'guias' | 'historial'>('pagos');
  const [comprobanteAmpliado, setComprobanteAmpliado] = useState<string | null>(null);
  const [isUploadingGuia, setIsUploadingGuia] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
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
      toast.success("¡Pago aprobado! Se ha descontado el stock y notificado a la clienta.");
    } else {
      toast.error("¡Uy! Tuvimos un problema al aprobar este pago.");
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
      toast.success("Pago rechazado. El stock fue devuelto al catálogo.");
    } else {
      toast.error("¡Uy! Tuvimos un problema al rechazar este pago.");
    }
  };

  
  const entregarPedidoEnTienda = async (pedido: any) => {
    const res = await updateEstadoVenta(pedido.id, 'ENTREGADO');
    if (res.success) {
      toast.success("¡Pedido entregado exitosamente en tienda!");
      const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: 'ENTREGADO' } : p);
      setPedidos(nuevosPedidos);
    } else {
      toast.error("Error al entregar: " + res.error);
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

  const handleSubirGuia = async (e: React.ChangeEvent<HTMLInputElement>, pedido: any) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingGuia(pedido.id);
      try {
        const file = e.target.files[0];
        const compressedFile = await compressImage(file, 'alta'); // Guía en alta calidad
        const fileData = new FormData();
        fileData.append("file", compressedFile);
        
        const resUpload = await uploadImage(fileData);
        if (resUpload.success && resUpload.url) {
          const resGuia = await subirGuiaEnvio(pedido.id, resUpload.url);
          if (resGuia.success) {
            const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, guiaEnvioUrl: resUpload.url } : p);
            setPedidos(nuevosPedidos);
            toast.success("¡Excelente! La guía se subió y guardó correctamente.");
          } else {
            toast.error("Hubo un inconveniente al vincular la guía con el pedido.");
          }
        } else {
          toast.error("Hubo un error subiendo la imagen. Por favor, intenta de nuevo.");
        }
      } catch (err) {
        toast.error("¡Uy! Ocurrió un error inesperado al subir la guía.");
      }
      setIsUploadingGuia(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }


  const pedidosFiltrados = pedidos.filter(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return false;

    const arts = pedido.articulos || [];
    const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
    
    const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
    const esAbandonado = pedido.estado === 'Esperando Pago' || pedido.estado === 'Expirado';

    const textoBusqueda = busqueda.toLowerCase();
    const coincideBusqueda = 
      (pedido.cliente && pedido.cliente.toLowerCase().includes(textoBusqueda)) || 
      (pedido.ci && pedido.ci.includes(textoBusqueda)) || 
      (pedido.id && pedido.id.toLowerCase().includes(textoBusqueda));

    if (busqueda && !coincideBusqueda) return false;

    if (filtroTab === 'pagos') return pedido.estado === 'Pendiente' && !esAbandonado;
    if (filtroTab === 'empaquetar') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'guias') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'historial') return pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO');
    
    return true;
  });

  const pedidosARenderizar = filtroTab === 'historial' ? pedidosFiltrados.slice(0, 50) : pedidosFiltrados;

  return (
    <div className="flex-1 p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Gestión de Pedidos</h1>
          <p className="text-foreground/70">Verifica comprobantes y prepara envíos.</p>
        </div>
        
        <div className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner max-w-sm w-full relative">
          <Search className="w-5 h-5 text-foreground/50 mr-3" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, CI o ID..." 
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium"
          />
          {busqueda && <X className="w-4 h-4 text-foreground/50 cursor-pointer absolute right-4" onClick={() => setBusqueda("")} />}
        </div>

        {/* Pestañas (Tabs) */}
        <div className="flex flex-wrap bg-surface border border-surface-border p-1 rounded-xl gap-1">
          <button 
            onClick={() => setFiltroTab('pagos')}
            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${filtroTab === 'pagos' ? 'bg-brand-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Confirmar Pago
          </button>
          <button 
            onClick={() => setFiltroTab('empaquetar')}
            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${filtroTab === 'empaquetar' ? 'bg-orange-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Empaquetado Pendiente
          </button>
          <button 
            onClick={() => setFiltroTab('guias')}
            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${filtroTab === 'guias' ? 'bg-blue-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Enviar Guía
          </button>
          <button 
            onClick={() => setFiltroTab('historial')}
            className={`px-3 py-2 rounded-lg font-bold text-xs transition-all ${filtroTab === 'historial' ? 'bg-green-500 text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            Historial
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
          <table className="w-full text-left border-collapse hidden lg:table">
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
              {pedidosARenderizar.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-foreground/50 font-medium">
                    No hay pedidos en esta sección.
                  </td>
                </tr>
              ) : pedidosARenderizar.map((pedido) => {
                const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
                const arts = pedido.articulos || [];
                const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
                return (
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
                      if (pedido.estado !== 'Aprobado' && pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PREPARANDO') {
                        return (
                          <div className="flex flex-col items-center justify-center p-2 bg-surface-border/30 rounded-lg border border-dashed border-surface-border">
                            <span className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold text-center">Verificar Primero</span>
                          </div>
                        );
                      }

                      return (
                        <button 
                          onClick={() => {
                            if (!esTiendaDirecta) setPedidoEmpaquetando(pedido);
                          }}
                          className={`px-3 py-2 rounded-lg font-bold text-xs transition-colors flex flex-col items-center justify-center w-full gap-1 border shadow-sm ${
                            esTiendaDirecta 
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 cursor-default'
                            : todasEmpaquetadas 
                            ? 'bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500 hover:text-white'
                            : 'bg-orange-500/10 text-orange-600 border-orange-500/30 hover:bg-orange-500 hover:text-white'
                          }`}
                        >
                          {esTiendaDirecta ? (
                            <><CheckCircle className="w-5 h-5" /> Entregado en Tienda</>
                          ) : todasEmpaquetadas ? (
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
                    <a 
                      href={`https://wa.me/${pedido.celular?.startsWith("591") ? pedido.celular : `591${pedido.celular}`}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-[#25D366] flex items-center gap-1 mt-0.5 hover:underline font-bold"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="css-i6dzq1"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                      {pedido.celular}
                    </a>
                    <div className="text-xs font-mono text-foreground/50 mt-0.5">
                      CI: {pedido.ci}
                    </div>
                  </td>
                  <td className="p-4 text-foreground/90">{pedido.destino}</td>
                  <td className="p-4 font-bold text-foreground">{pedido.total.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pedido.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                      (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO') ? 'bg-green-500/20 text-green-600 border border-green-500/50' :
                      'bg-red-500/20 text-red-500 border border-red-500/50'
                    }`}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="p-4 flex justify-center gap-2">
                    {pedido.estado === 'Pendiente' && (
                      <button 
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Ver Comprobante"
                      >
                        <Eye className="w-4 h-4" /> Verificar Pago
                      </button>
                    )}
                    
                    {pedido.estado !== 'Rechazado' && !esTiendaDirecta && (
                      <button 
                        onClick={() => imprimirVineta(pedido)}
                        className="px-3 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md border border-slate-600 flex-shrink-0 flex items-center gap-2 font-bold text-xs"
                        title="Imprimir Viñeta"
                      >
                        <Printer className="w-4 h-4" /> Ticket de Envío
                      </button>
                    )}

                    {(pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias' || filtroTab === 'historial') && !esTiendaDirecta && (
                      <div className="flex items-center gap-1">
                        <div className="relative group" title="Subir o Ver Guía de Envío">
                          <label className={`p-2 rounded-lg transition-colors shadow-md border flex items-center justify-center cursor-pointer ${pedido.guiaEnvioUrl ? 'bg-green-100 text-green-700 border-green-300' : 'bg-brand-primary text-white hover:bg-brand-accent'}`}>
                            {isUploadingGuia === pedido.id ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : pedido.guiaEnvioUrl ? (
                              <div className="flex items-center gap-2 font-bold text-xs" onClick={(e) => { e.preventDefault(); setComprobanteAmpliado(pedido.guiaEnvioUrl); }}>
                                <CheckCircle className="w-4 h-4" /> Ver Guía de Envío
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 font-bold text-xs">
                                <Upload className="w-4 h-4" /> Subir Guía
                              </div>
                            )}
                            <input type="file" className="hidden" accept="image/*" disabled={!todasEmpaquetadas || isUploadingGuia === pedido.id} onChange={(e) => handleSubirGuia(e, pedido)} />
                          </label>
                        </div>
                        {pedido.guiaEnvioUrl && (
                          <button 
                            title="Enviar Guía por WhatsApp"
                            onClick={() => {
                              const mensaje = `¡Hola ${pedido.cliente}! 😊 Tu pedido de BrunaShop (ID: ${pedido.id.slice(-6).toUpperCase()}) ya fue enviado. Aquí tienes la foto de tu guía de envío para que puedas recogerlo: ${pedido.guiaEnvioUrl}\n\n¡Gracias por tu preferencia!`;
                              enviarWhatsApp(pedido.celular, mensaje);
                            }}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md border border-green-600"
                          >
                            <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {pedidosARenderizar.length === 0 ? (
            <div className="p-10 text-center text-foreground/50 font-medium bg-surface rounded-xl">No hay pedidos en esta sección.</div>
          ) : pedidosARenderizar.map((pedido) => {
            const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
            const arts = pedido.articulos || [];
            const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
            
            return (
              <div key={pedido.id} className="bg-surface border border-surface-border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                <div className="flex justify-between items-center border-b border-surface-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-primary">{pedido.id.slice(-6).toUpperCase()}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${pedido.origen === 'WEB' ? 'bg-blue-500/20 text-blue-500' : 'bg-pink-500/20 text-pink-500'}`}>{pedido.origen}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground">Bs. {pedido.total.toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{pedido.cliente}</div>
                  <div className="text-xs text-foreground/60">{pedido.destino} - {pedido.celular}</div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className={`px-2 py-1 rounded-full font-bold ${pedido.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-500' : (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO') ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-500'}`}>{pedido.estado}</span>
                  <span className="font-medium text-foreground/70">{arts.length} prendas</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-surface-border mt-1">
                  {(() => {
                    if (pedido.estado !== 'Aprobado' && pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PREPARANDO' && pedido.estado !== 'ENVIADO') {
                      return null;
                    }
                    return (
                      <button 
                        onClick={() => {
                          if (!esTiendaDirecta) setPedidoEmpaquetando(pedido);
                        }}
                        className={`w-full px-3 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-md ${
                          esTiendaDirecta 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 cursor-default'
                          : todasEmpaquetadas 
                          ? 'bg-green-500/20 text-green-700 border border-green-500/50 hover:bg-green-500 hover:text-white'
                          : 'bg-orange-500 text-white border-orange-500/30 hover:bg-orange-600'
                        }`}
                      >
                        {esTiendaDirecta ? (
                          <><CheckCircle className="w-4 h-4" /> Entregado en Tienda</>
                        ) : todasEmpaquetadas ? (
                          <><CheckCircle className="w-4 h-4" /> Listo (Ver Paquete)</>
                        ) : (
                          <><PackageCheck className="w-4 h-4" /> Empaquetar ({arts.filter((a:any) => a.empaquetado).length}/{arts.length})</>
                        )}
                      </button>
                    );
                  })()}

                  {pedido.estado === 'Pendiente' && (
                    <button onClick={() => setPedidoSeleccionado(pedido)} className="px-3 py-1.5 bg-brand-primary text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Eye className="w-4 h-4"/> Verificar Pago
                    </button>
                  )}
                  {pedido.estado !== 'Rechazado' && !esTiendaDirecta && (
                    <button onClick={() => imprimirVineta(pedido)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4"/> Ticket Envío
                    </button>
                  )}
                  
                  {(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias')) && (
                    <div className="w-full flex gap-2">
                      <label className={`flex-1 text-center px-3 py-1.5 rounded-lg shadow-md font-bold text-xs flex items-center justify-center cursor-pointer border ${pedido.guiaEnvioUrl ? 'bg-green-500/20 text-green-600 border-green-500/50' : 'bg-brand-primary text-white'}`}>
                        {pedido.guiaEnvioUrl ? 'Ver Guía' : 'Subir Guía'}
                        <input type="file" className="hidden" accept="image/*" disabled={!todasEmpaquetadas || isUploadingGuia === pedido.id} onChange={(e) => handleSubirGuia(e, pedido)} />
                      </label>
                      {pedido.guiaEnvioUrl && (
                        <button onClick={() => enviarWhatsApp(pedido.celular, `¡Hola ${pedido.cliente}! 😊 Tu pedido de BrunaShop (ID: ${pedido.id.slice(-6).toUpperCase()}) ya fue enviado. Aquí tienes la foto de tu guía de envío para que puedas recogerlo: ${pedido.guiaEnvioUrl}`)} className="px-3 py-1.5 bg-green-500 text-white shadow-md rounded-lg"><MessageCircle className="w-4 h-4"/></button>
                      )}
                    </div>
                  )}

                  
                      {filtroTab === 'guias' && (
                        <button onClick={() => entregarPedidoEnTienda(pedido)} className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg shadow-md flex flex-shrink-0 items-center gap-2 font-bold text-xs" title="Finalizar sin guía">
                          <CheckCircle className="w-4 h-4" /> Finalizar
                        </button>
                      )}

                    
                  {filtroTab === 'guias' && (
                     <button onClick={() => entregarPedidoEnTienda(pedido)} className="w-full mt-2 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md">
                       <CheckCircle className="w-4 h-4" /> Finalizar sin Guía
                     </button>
                  )}

                  {filtroTab === 'guias' && pedido.tipoEntrega === 'RECOJO_TIENDA' && (
                     <button onClick={() => entregarPedidoEnTienda(pedido)} className="w-full mt-2 px-3 py-2 bg-orange-500 shadow-md hover:bg-orange-600 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2">
                       <CheckCircle className="w-4 h-4" /> Entregar en Tienda
                     </button>
                  )}

                </div>
              </div>
            )
          })}
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
              className="relative bg-surface border border-surface-border rounded-3xl shadow-2xl max-w-lg w-full z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-border shrink-0">
                <h2 className="text-2xl font-bold text-foreground">Verificar Pago: {pedidoSeleccionado.id.slice(-6).toUpperCase()}</h2>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-background rounded-xl p-4 mb-6 flex justify-between items-center border border-surface-border">
                <div>
                  <p className="text-sm text-foreground/70">Monto a verificar:</p>
                  <p className="text-3xl font-black text-green-500">Bs. {pedidoSeleccionado.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-primary font-bold uppercase tracking-widest mb-1">Depositante:</p>
                  <p className="font-bold text-foreground leading-tight">
                    {pedidoSeleccionado.depositanteNombres || "No registrado"} {pedidoSeleccionado.depositanteApPaterno} {pedidoSeleccionado.depositanteApMaterno}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1">
                    Cuenta: {pedidoSeleccionado.cliente} (CI: {pedidoSeleccionado.ci})
                  </p>
                </div>
              </div>

              {/* Imagen del Comprobante */}
              <div 
                className="flex-1 overflow-auto bg-black rounded-xl mb-6 flex items-center justify-center relative group min-h-[300px] cursor-zoom-in"
                onClick={() => setComprobanteAmpliado(pedidoSeleccionado.comprobanteUrl)}
              >
                <img 
                  src={pedidoSeleccionado.comprobanteUrl} 
                  alt="Comprobante" 
                  className="max-w-full max-h-full object-contain rounded-xl transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md pointer-events-none">Foto subida por clienta</div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                  <span className="text-white font-bold tracking-widest uppercase flex items-center gap-2"><Search className="w-5 h-5" /> Ampliar</span>
                </div>
              </div>
              <div className="flex justify-end mb-4 -mt-2">
                <button 
                  onClick={() => forceDownload(pedidoSeleccionado.comprobanteUrl, `comprobante_${pedidoSeleccionado.id.slice(-6)}.jpg`)}
                  className="flex items-center gap-2 text-brand-primary text-sm font-bold hover:underline"
                >
                  <Download className="w-4 h-4" /> Forzar Descarga Directa
                </button>
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
              </div>
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
              className="relative bg-surface border border-surface-border rounded-3xl shadow-2xl max-w-2xl w-full z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-border shrink-0 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Lista de Empaque</h2>
                  <p className="text-foreground/60 text-sm">Pedido: <span className="font-mono text-brand-primary font-bold">{pedidoEmpaquetando.id.slice(-6).toUpperCase()}</span> - {pedidoEmpaquetando.cliente}</p>
                </div>
                <button onClick={() => setPedidoEmpaquetando(null)} className="p-2 hover:bg-surface-border rounded-full transition-colors">
                  <XCircle className="w-6 h-6 text-foreground/50" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
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

              <div className="p-6 border-t border-surface-border shrink-0">
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

      {/* Lightbox para Comprobante Ampliado */}
      <AnimatePresence>
        {comprobanteAmpliado && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setComprobanteAmpliado(null)}
          >
            <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2" onClick={() => setComprobanteAmpliado(null)}>
              <X className="w-8 h-8" />
            </button>
            <img src={comprobanteAmpliado} alt="Comprobante Ampliado" className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl" />
            <div className="flex flex-col items-center mt-6 gap-3">
              <button 
                className="bg-brand-primary text-white px-6 py-2 rounded-full font-bold shadow-xl hover:bg-brand-accent transition-colors flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  forceDownload(comprobanteAmpliado, `archivo_brunashop.jpg`);
                }}
              >
                <Download className="w-5 h-5" /> Descargar Imagen
              </button>
              <p className="text-white/50 tracking-widest uppercase text-xs font-bold">Haz clic en el fondo para cerrar</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Elemento de cierre necesario en map */}
      {(() => null)()}
    </div>
  );
}
