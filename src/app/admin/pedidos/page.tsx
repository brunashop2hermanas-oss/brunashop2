"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, Eye, CheckCircle, XCircle, Printer, MessageCircle, Star, PackageCheck, Download, X, Upload, Wallet, Package, Truck, History, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";
import { getConfiguracion } from "@/app/actions/config";
import { getPrendas } from "@/app/actions/productos";
import { uploadImage } from "@/app/actions/upload";
import { compressImage } from "@/lib/imageCompression";
import toast from "react-hot-toast";
import { ConfirmModal, ConfirmVariant } from "@/components/ui/ConfirmModal";

const resolveImage = (item: any, colorSeleccionado?: string, fallbackIndex = 0) => {
  let img = item?.imagenes?.[fallbackIndex] || item?.imagen; // For art.imagen mapping
  if (colorSeleccionado && item?.imagenesPorColor) {
    let raw = item.imagenesPorColor;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch(e){} }
    if (typeof raw === 'object' && raw !== null) {
      const keyMatch = Object.keys(raw).find(k => k.toLowerCase() === colorSeleccionado.toLowerCase());
      if (keyMatch && typeof raw[keyMatch] === 'string') {
        img = raw[keyMatch];
      }
    }
  }
  return img || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80";
};

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

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export default function AdminDashboard() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<any>(null); // Modal de Verificación de Pago
  const [pedidoEmpaquetando, setPedidoEmpaquetando] = useState<any>(null); // Modal de Empaquetado
  const [pedidosParaImprimir, setPedidosParaImprimir] = useState<string[]>([]);
  const [filtroTab, setFiltroTab] = useState<'pagos' | 'empaquetar' | 'guias' | 'historial' | 'rechazados'>('pagos');
  
  const borrarDefinitivamente = (id: string) => {
    confirmarAccion(
      "Eliminar Pedido",
      "¿Estás súper segura de que quieres ELIMINAR DEFINITIVAMENTE este pedido? Esta acción no se puede deshacer.",
      "danger",
      async () => {
        const res = await deleteVenta(id);
        if (res.success) {
          setPedidos(pedidos.filter(p => p.id !== id));
          toast.success("Pedido eliminado definitivamente.");
        } else {
          toast.error("Error al eliminar el pedido.");
        }
      }
    );
  };

  const restaurarPago = (pedido: any) => {
    confirmarAccion(
      "Restaurar Pedido",
      "¿Deseas RESTAURAR este pedido? Volverá a estar pendiente de verificación.",
      "warning",
      async () => {
        const res = await updateEstadoVenta(pedido.id, 'Pendiente');
        if (res.success) {
          const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: 'Pendiente' } : p);
          setPedidos(nuevosPedidos);
          toast.success("Pedido restaurado a Pendiente.");
        } else {
          toast.error("Error al restaurar pedido.");
        }
      }
    );
  };
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'semana' | 'mes' | 'año' | 'todo' | 'dia_especifico' | 'mes_especifico'>('todo');
  const [fechaEspecifica, setFechaEspecifica] = useState("");
  const [mesEspecifico, setMesEspecifico] = useState("");
  const [comprobanteAmpliado, setComprobanteAmpliado] = useState<string | null>(null);
  const [isUploadingGuia, setIsUploadingGuia] = useState<string | null>(null);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: ConfirmVariant;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  const confirmarAccion = (title: string, message: string, variant: ConfirmVariant, action: () => void) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      variant,
      onConfirm: () => {
        setConfirmConfig(null);
        action();
      },
      onCancel: () => setConfirmConfig(null)
    });
  };
  const [busqueda, setBusqueda] = useState("");
  const [pedidoACompletar, setPedidoACompletar] = useState<any>(null);
  const [pedidoPreviewArticulos, setPedidoPreviewArticulos] = useState<any>(null);
  const [config, setConfig] = useState<any>({});
  const [guiaPreview, setGuiaPreview] = useState<{file: File, pedido: any} | null>(null);
  
  const [visibleCount, setVisibleCount] = useState(15);
  const cargarMas = () => setVisibleCount(prev => prev + 15);

  // Reiniciar la paginación cuando cambia el filtro
  useEffect(() => {
    setVisibleCount(15);
  }, [filtroTab, filtroFecha, busqueda]);

  // Función para obtener pedidos de la base de datos
  
  const handleCompletarSinGuia = async () => {
    if (!pedidoACompletar) return;
    const res = await updateEstadoVenta(pedidoACompletar.id, 'ENTREGADO');
    if (res.success) {
      const nuevosPedidos = pedidos.map(p => p.id === pedidoACompletar.id ? { ...p, estado: 'ENTREGADO' } : p);
      setPedidos(nuevosPedidos);
      toast.success('Pedido marcado como completado y enviado a historial.');
      setPedidoACompletar(null);
    } else {
      toast.error('Error al completar el pedido.');
    }
  };

  const fetchPedidos = async () => {
    const resConf = await getConfiguracion();
    if (resConf.success) setConfig(resConf.data);
    const res = await getVentas();
    if (res.success) {
      setPedidos(res.data || []);
    }
    setIsLoading(false);
  };

  const fetchProductos = async () => {
    const res = await getPrendas();
    if (res.success) {
      setProductos(res.data || []);
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchProductos();
    
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

  
  const getWhatsAppMessage = (tipo: string, pedido: any) => {
    let template = "";
    const isLocal = pedido.destino && pedido.destino.toUpperCase() === 'LA PAZ';
    if (tipo === 'APROBADO') {
      template = isLocal 
        ? (config?.msgAprobadoLocal || "¡Hola {cliente}! 🌸 Tu pago por {total} Bs ha sido recibido con éxito y tu pedido está confirmado ✅.")
        : (config?.msgAprobadoNacional || "Estamos preparando tu envío hacia {destino}. Te avisaremos en cuanto esté en camino. ¡Gracias por elegir Bruna Shop! 💖🛍️");
    } else if (tipo === 'RECHAZADO') {
      template = isLocal
        ? (config?.msgRechazadoLocal || "Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌")
        : (config?.msgRechazadoNacional || "Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌");
    } else if (tipo === 'GUIA') {
      template = isLocal
        ? (config?.msgGuiaLocal || "¡Hola {cliente}! 🌸 Tu paquete ya está listo y completado.\n\nPuedes hacer seguimiento o ver el detalle aquí:\n{urlGuia}")
        : (config?.msgGuiaNacional || "¡Hola {cliente}! 🌸 Tu paquete ya está en camino hacia {destino}. 🚚\n\nPuedes hacer seguimiento de tu guía aquí:\n{urlGuia}");
    }

    return template
      .replace(/{cliente}/g, pedido.cliente || '')
      .replace(/{total}/g, pedido.total ? pedido.total.toFixed(2) : '')
      .replace(/{destino}/g, pedido.destino || 'tu ciudad')
      .replace(/{urlGuia}/g, pedido.guiaEnvioUrl || '');
  };

  const reenviarWhatsApp = (pedido: any) => {
    let tipo = "";
    if (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') tipo = "APROBADO";
    else if (pedido.estado === 'Rechazado') tipo = "RECHAZADO";
    else if (pedido.guiaEnvioUrl || pedido.estado === 'ENTREGADO') tipo = "GUIA";
    else {
      toast.error("Este pedido no tiene un estado válido para enviar mensaje.");
      return;
    }
    const mensaje = getWhatsAppMessage(tipo, pedido);
    enviarWhatsApp(pedido.celular, mensaje);
  };

  const aprobarPago = (pedido: any) => {
    confirmarAccion(
      "Aprobar Pago",
      "¿Estás segura de que quieres APROBAR este pago? El pedido pasará a la etapa de empaquetado.",
      "success",
      async () => {
        const res = await updateEstadoVenta(pedido.id, 'Aprobado');
        if (res.success) {
          // Actualización optimista local
          const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: "Aprobado" } : p);
          setPedidos(nuevosPedidos);
          setPedidoSeleccionado(null);
          
          const mensaje = getWhatsAppMessage("APROBADO", pedido);
          enviarWhatsApp(pedido.celular, mensaje);
          toast.success("¡Pago aprobado! Se ha descontado el stock y notificado a la clienta.");
        } else {
          toast.error("¡Uy! Tuvimos un problema al aprobar este pago.");
        }
      }
    );
  };

  const rechazarPago = (pedido: any) => {
    confirmarAccion(
      "Rechazar Pago",
      "¿Estás segura de que quieres RECHAZAR este pago? El pedido será movido a Rechazados.",
      "danger",
      async () => {
        const res = await updateEstadoVenta(pedido.id, 'Rechazado');
        if (res.success) {
          const nuevosPedidos = pedidos.map(p => p.id === pedido.id ? { ...p, estado: "Rechazado" } : p);
          setPedidos(nuevosPedidos);
          setPedidoSeleccionado(null);

          const mensaje = getWhatsAppMessage("RECHAZADO", pedido);
          enviarWhatsApp(pedido.celular, mensaje);
          toast.success("Pago rechazado. El stock fue devuelto al catálogo.");
        } else {
          toast.error("¡Uy! Tuvimos un problema al rechazar este pago.");
        }
      }
    );
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

  const handleSubirGuia = (e: React.ChangeEvent<HTMLInputElement>, pedido: any) => {
    if (e.target.files && e.target.files[0]) {
      setGuiaPreview({ file: e.target.files[0], pedido });
    }
  };

  const confirmarSubirGuia = async () => {
    if (!guiaPreview) return;
    const { file, pedido } = guiaPreview;
    
    // Cerramos el modal de inmediato
    setGuiaPreview(null);
    setIsUploadingGuia(pedido.id);
    
    try {
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
    } finally {
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

  // --- Modal Preview Guía ---
  {guiaPreview && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface p-6 rounded-2xl max-w-sm w-full shadow-2xl border border-surface-border">
        <h3 className="text-xl font-bold mb-4 uppercase text-center">Verifica tu Imagen</h3>
        <p className="text-foreground/70 mb-6 text-sm text-center">¿Estás segura de enviar esta guía de envío para el pedido de {guiaPreview.pedido.cliente}?</p>
        
        <div 
          className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-8 border border-black/10 cursor-pointer group"
          onClick={() => setComprobanteAmpliado(URL.createObjectURL(guiaPreview.file))}
          title="Hacer clic para ver en pantalla completa"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={URL.createObjectURL(guiaPreview.file)} 
            alt="Previsualización de Guía" 
            className="w-full h-full object-contain"
          />
          <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 backdrop-blur-sm shadow-md flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
            <Search className="w-5 h-5" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setGuiaPreview(null)} className="flex-1 py-2 rounded-lg bg-surface-border font-bold">Cancelar</button>
          <button onClick={confirmarSubirGuia} className="flex-1 py-2 rounded-lg bg-brand-primary text-white font-bold">Subir</button>
        </div>
      </div>
    </div>
  )}

  const pedidosPorFecha = pedidos.filter(pedido => {
    if (!pedido.fechaRaw) return true; // Fallback para registros antiguos
    const fechaPedido = new Date(pedido.fechaRaw);
    const hoy = new Date();
    
    if (filtroFecha === 'todo') return true;
    if (filtroFecha === 'hoy') return fechaPedido.getDate() === hoy.getDate() && fechaPedido.getMonth() === hoy.getMonth() && fechaPedido.getFullYear() === hoy.getFullYear();
    if (filtroFecha === 'semana') return (hoy.getTime() - fechaPedido.getTime()) <= (7 * 24 * 60 * 60 * 1000);
    if (filtroFecha === 'mes') return fechaPedido.getMonth() === hoy.getMonth() && fechaPedido.getFullYear() === hoy.getFullYear();
    if (filtroFecha === 'año') return fechaPedido.getFullYear() === hoy.getFullYear();
    
    if (filtroFecha === 'dia_especifico' && fechaEspecifica) {
      const [y, m, d] = fechaEspecifica.split("-").map(Number);
      return fechaPedido.getDate() === d && fechaPedido.getMonth() === m - 1 && fechaPedido.getFullYear() === y;
    }
    if (filtroFecha === 'mes_especifico' && mesEspecifico) {
      const [y, m] = mesEspecifico.split("-").map(Number);
      return fechaPedido.getMonth() === m - 1 && fechaPedido.getFullYear() === y;
    }
    
    return true;
  });

  const pedidosFiltrados = pedidosPorFecha.filter(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return false;

    const arts = pedido.articulos || [];
    const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
    
    const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
    const esAbandonado = pedido.estado === 'Esperando Pago' || pedido.estado === 'Expirado';

    const textoBusqueda = busqueda.toLowerCase().trim();
    if (textoBusqueda) {
      const coincideBusqueda = 
        (pedido.cliente && pedido.cliente.toLowerCase().includes(textoBusqueda)) || 
        (pedido.ci && pedido.ci.includes(textoBusqueda)) || 
        (pedido.id && pedido.id.toLowerCase().includes(textoBusqueda));
      return coincideBusqueda;
    }

    if (filtroTab === 'pagos') return pedido.estado === 'Pendiente' && !esAbandonado;
    if (filtroTab === 'empaquetar') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'guias') return (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO';
    if (filtroTab === 'rechazados') return pedido.estado === 'Rechazado';
    if (filtroTab === 'historial') return pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO');
    
    return true;
  });

  const pedidosARenderizarCompleto = busqueda.trim() ? pedidos.filter(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return false;
    const t = busqueda.toLowerCase().trim();
    return (pedido.cliente && pedido.cliente.toLowerCase().includes(t)) || 
           (pedido.ci && pedido.ci.includes(t)) || 
           (pedido.id && pedido.id.toLowerCase().includes(t));
  }) : pedidosFiltrados;

  const pedidosARenderizar = pedidosARenderizarCompleto.slice(0, visibleCount);

  const counts = { pagos: 0, empaquetar: 0, guias: 0, historial: 0, rechazados: 0 };
  pedidosPorFecha.forEach(pedido => {
    if (pedido.origen === 'CAJA' || pedido.origen === 'POS') return;
    const arts = pedido.articulos || [];
    const esTiendaDirecta = pedido.tipoEntrega === 'TIENDA' || (!pedido.tipoEntrega && (pedido.destino === 'Tienda Física' || pedido.origen === 'CAJA'));
    const todasEmpaquetadas = esTiendaDirecta ? true : (arts.length > 0 && arts.every((art: any) => art.empaquetado));
    const esAbandonado = pedido.estado === 'Esperando Pago' || pedido.estado === 'Expirado';

    if (pedido.estado === 'Pendiente' && !esAbandonado) counts.pagos++;
    else if ((pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && !todasEmpaquetadas && !esAbandonado && pedido.estado !== 'ENTREGADO') counts.empaquetar++;
    else if ((pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && todasEmpaquetadas && !pedido.guiaEnvioUrl && !esAbandonado && pedido.estado !== 'ENTREGADO') counts.guias++;
    else if (pedido.estado === 'Rechazado') counts.rechazados++;
    else if (pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO' || (todasEmpaquetadas && !!pedido.guiaEnvioUrl) || (esTiendaDirecta && pedido.estado === 'ENTREGADO')) counts.historial++;
  });

  return (
    <div className="flex-1 relative min-w-0 w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground mb-2">Gestión de Pedidos</h1>
          <p className="text-foreground/70 mb-4">Verifica comprobantes y prepara envíos.</p>
          <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              <strong>Tip de uso:</strong> Esta pantalla es el "corazón" de tus envíos. Sigue el flujo de izquierda a derecha en las pestañas: primero verifica los pagos (1), luego empaqueta las prendas (2) y por último, sube el comprobante de envío o despáchalo (3).
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Selector de Fechas (Dropdown) */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-surface border border-surface-border px-3 py-2 rounded-xl shadow-inner w-full sm:w-auto relative group">
              <Calendar className="w-5 h-5 text-brand-primary mr-2 shrink-0" />
              <select 
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value as any)}
                className="bg-transparent border-none outline-none w-full sm:w-40 text-sm font-bold text-foreground cursor-pointer appearance-none"
              >
                <option value="todo">Ver todo el historial</option>
                <option value="hoy">⭐ Pedidos de HOY</option>
                <option value="dia_especifico">🔍 Buscar otro día...</option>
                <option value="mes_especifico">🔍 Buscar un mes...</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {filtroFecha === 'dia_especifico' && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <input 
                  type="date" 
                  value={fechaEspecifica}
                  onChange={(e) => setFechaEspecifica(e.target.value)}
                  className="bg-brand-primary/10 border-2 border-brand-primary px-4 py-2 rounded-xl text-sm font-bold text-brand-primary outline-none focus:ring-4 focus:ring-brand-primary/40 shadow-lg w-full sm:w-auto cursor-pointer"
                />
                {!fechaEspecifica && <span className="text-xs font-extrabold text-brand-primary animate-pulse whitespace-nowrap">👈 Toca para elegir</span>}
              </div>
            )}
            {filtroFecha === 'mes_especifico' && (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <input 
                  type="month" 
                  value={mesEspecifico}
                  onChange={(e) => setMesEspecifico(e.target.value)}
                  className="bg-brand-primary/10 border-2 border-brand-primary px-4 py-2 rounded-xl text-sm font-bold text-brand-primary outline-none focus:ring-4 focus:ring-brand-primary/40 shadow-lg w-full sm:w-auto cursor-pointer"
                />
                {!mesEspecifico && <span className="text-xs font-extrabold text-brand-primary animate-pulse whitespace-nowrap">👈 Toca para elegir</span>}
              </div>
            )}
          </div>

          <div className="flex items-center bg-surface border border-surface-border px-4 py-2 rounded-xl shadow-inner w-full sm:min-w-[280px] sm:max-w-md relative flex-1 shrink-0">
            <Search className="w-5 h-5 text-foreground/50 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, CI o ID..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
            />
            {busqueda && <X className="w-4 h-4 text-foreground/50 cursor-pointer absolute right-4 shrink-0" onClick={() => setBusqueda("")} />}
          </div>
        </div>
      </div>

      {/* Pestañas (Tabs) Pipeline */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row bg-surface border border-surface-border p-1.5 rounded-2xl gap-2 overflow-x-auto custom-scrollbar">
          <button 
            onClick={() => setFiltroTab('pagos')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'pagos' ? 'bg-brand-primary text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <Wallet className="w-5 h-5" /> Confirmar Pago
            {counts.pagos > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'pagos' ? 'bg-white text-brand-primary' : 'bg-brand-primary text-white animate-pulse'}`}>
                {counts.pagos}
              </span>
            )}
          </button>
          
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('empaquetar')}
            className={`flex-1 min-w-[160px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'empaquetar' ? 'bg-orange-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <Package className="w-5 h-5" /> Empaquetar
            {counts.empaquetar > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'empaquetar' ? 'bg-white text-orange-500' : 'bg-orange-500 text-white animate-pulse'}`}>
                {counts.empaquetar}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('guias')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'guias' ? 'bg-blue-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <Truck className="w-5 h-5" /> Enviar Guía
            {counts.guias > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'guias' ? 'bg-white text-blue-500' : 'bg-blue-500 text-white animate-pulse'}`}>
                {counts.guias}
              </span>
            )}
          </button>

          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>

          <button 
            onClick={() => setFiltroTab('historial')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'historial' ? 'bg-green-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <History className="w-5 h-5" /> Historial
          </button>
          <div className="hidden sm:flex items-center text-surface-border shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          <button 
            onClick={() => setFiltroTab('rechazados')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative ${filtroTab === 'rechazados' ? 'bg-red-500 text-white shadow-lg scale-[1.02]' : 'bg-surface hover:bg-surface-border/50 text-foreground/70'}`}
          >
            <XCircle className="w-5 h-5" /> Rechazados
            {counts.rechazados > 0 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-surface shadow-sm ${filtroTab === 'rechazados' ? 'bg-white text-red-500' : 'bg-red-500 text-white animate-pulse'}`}>
                {counts.rechazados}
              </span>
            )}
          </button>
        </div>
        
        {pedidosParaImprimir.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button 
              onClick={imprimirSeleccionados}
              className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold shadow-xl hover:bg-brand-accent transition-colors flex items-center justify-center gap-2 animate-bounce w-full sm:w-auto"
            >
              <Printer className="w-5 h-5" /> Imprimir {pedidosParaImprimir.length} Viñetas de Envío
            </button>
          </div>
        )}
      </div>

      {/* Tabla de Pedidos */}
      <div className="glass rounded-3xl overflow-hidden border border-surface-border shadow-3d">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="bg-surface border-b border-surface-border text-foreground/80 text-xs uppercase tracking-wider">
                <th className="px-2 py-3 font-semibold w-8"></th>
                <th className="px-2 py-3 font-semibold">ID Pedido</th>
                <th className="px-2 py-3 font-semibold">Origen</th>
                <th className="px-2 py-3 font-semibold">Fecha y Hora</th>
                <th className="px-2 py-3 font-semibold">Prendas a Enviar</th>
                <th className="px-2 py-3 font-semibold">Clienta</th>
                <th className="px-2 py-3 font-semibold">Destino</th>
                <th className="px-2 py-3 font-semibold">Total (Bs)</th>
                <th className="px-2 py-3 font-semibold">Estado</th>
                <th className="px-2 py-3 font-semibold text-center">Acciones</th>
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
                  <td className="px-2 py-3">
                    {pedido.estado !== 'Rechazado' && (
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                        checked={pedidosParaImprimir.includes(pedido.id)}
                        onChange={() => toggleSeleccion(pedido.id)}
                      />
                    )}
                  </td>
                  <td className="px-2 py-3 font-mono font-medium text-brand-primary">{pedido.id.slice(-6).toUpperCase()}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-col items-start">
                      <div className={`inline-flex px-2 py-1 rounded text-xs font-bold mb-1 ${pedido.origen === 'WEB' ? 'bg-blue-500/20 text-blue-500' : (pedido.origen === 'CAJA' || pedido.origen === 'POS') ? 'bg-purple-500/20 text-purple-500' : 'bg-pink-500/20 text-pink-500'}`}>
                        {pedido.origen === 'POS' ? 'CAJA' : pedido.origen}
                      </div>
                      {pedido.registradoPor ? (
                        <div className="text-[10px] font-bold text-foreground/70 mt-1 bg-surface-border/50 px-1.5 py-0.5 rounded max-w-[120px] truncate" title={pedido.registradoPor}>
                          👤 <span className="text-brand-primary">{pedido.registradoPor.split(' ')[0]}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-foreground/50 mt-1 italic">Automático (Web)</div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="text-sm font-bold text-foreground/80 whitespace-nowrap">{pedido.fecha.split(',')[0]}</div>
                    <div className="text-xs text-foreground/50">{pedido.fecha.split(',')[1]}</div>
                  </td>
                  <td className="px-2 py-3">
                    {(() => {
                      if (pedido.estado !== 'Aprobado' && pedido.estado !== 'ENTREGADO' && pedido.estado !== 'PREPARANDO' && pedido.estado !== 'ENVIADO') {
                        return (
                          <button 
                            onClick={() => setPedidoPreviewArticulos(pedido)}
                            className="flex flex-col items-center justify-center p-2 bg-surface hover:bg-surface-border/50 transition-colors rounded-lg border border-dashed border-surface-border gap-1 w-full text-foreground/70 group"
                            title="Ver Prendas"
                          >
                            <Eye className="w-5 h-5 group-hover:text-brand-primary transition-colors" />
                            <span className="text-[10px] text-foreground/50 uppercase tracking-widest font-bold text-center group-hover:text-brand-primary transition-colors">Ver Prendas</span>
                          </button>
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
                  <td className="px-2 py-3">
                    <div className="font-bold text-foreground">{pedido.cliente}</div>
                    <a 
                      href={`https://wa.me/${pedido.celular?.startsWith("591") ? pedido.celular : `591${pedido.celular}`}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-[#25D366] flex items-center gap-1 mt-0.5 hover:underline font-bold"
                    >
                      <WhatsappIcon className="w-[14px] h-[14px] shrink-0" />
                      {pedido.celular}
                    </a>
                    <div className="text-xs font-mono text-foreground/50 mt-0.5">
                      CI: {pedido.ci}
                    </div>
                    {pedido.receptorDiferente && (
                      <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md text-xs">
                        <span className="font-bold text-blue-600 block mb-1 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Entregar a:
                        </span>
                        <div className="text-foreground/90 font-bold">{pedido.receptorNombres} {pedido.receptorApPaterno} {pedido.receptorApMaterno}</div>
                        <div className="font-mono mt-0.5 text-foreground/70">CI: {pedido.receptorCi}</div>
                        {pedido.receptorCelular && (
                          <a 
                            href={`https://wa.me/591${pedido.receptorCelular}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 text-[#25D366] flex items-center gap-1 font-bold hover:underline"
                          >
                            <WhatsappIcon className="w-[12px] h-[12px] shrink-0" />
                            {pedido.receptorCelular}
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-foreground/90">
                    <div>{pedido.destino}</div>
                    {pedido.empresaBusesPreferida && (
                      <div className="mt-2 p-1.5 bg-orange-500/10 border border-orange-500/20 rounded text-[10px] uppercase font-bold text-orange-600">
                        🚍 Flota: {pedido.empresaBusesPreferida}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-3 font-bold text-foreground">{pedido.total.toFixed(2)}</td>
                  <td className="px-2 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      pedido.estado === 'Pendiente' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50' : 
                      (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || pedido.estado === 'ENVIADO') ? 'bg-green-500/20 text-green-600 border border-green-500/50' :
                      'bg-red-500/20 text-red-500 border border-red-500/50'
                    }`}>
                      {pedido.estado}
                    </span>
                  </td>
                  <td className="px-2 py-3 flex flex-wrap justify-center gap-2">
                    {pedido.estado === 'Pendiente' && (
                      <button 
                        onClick={() => setPedidoSeleccionado(pedido)}
                        className="px-3 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-accent transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Ver Comprobante"
                      >
                        <Eye className="w-4 h-4" /> Verificar Pago
                      </button>
                    )}
                    
                    {pedido.estado === 'Rechazado' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => restaurarPago(pedido)}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                          title="Restaurar a Pendiente"
                        >
                          <History className="w-4 h-4" /> Restaurar Pedido
                        </button>
                        <button 
                          onClick={() => borrarDefinitivamente(pedido.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                          title="Borrar Definitivamente"
                        >
                          <XCircle className="w-4 h-4" /> Borrar Definitivamente
                        </button>
                      </div>
                    )}
                    
                    
                    {(pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && filtroTab === 'empaquetar' && (
                      <button 
                        onClick={() => enviarWhatsApp(pedido.celular, getWhatsAppMessage('APROBADO', pedido))}
                        className="px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Reenviar Mensaje WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" /> Reenviar Msg
                      </button>
                    )}
                    {pedido.estado === 'Rechazado' && filtroTab === 'rechazados' && (
                      <button 
                        onClick={() => enviarWhatsApp(pedido.celular, getWhatsAppMessage('RECHAZADO', pedido))}
                        className="px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Reenviar Mensaje WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" /> Reenviar Msg
                      </button>
                    )}

                    {pedido.terminosAceptados && (
                      <a 
                        href={`/admin/certificado/${pedido.id}`}
                        target="_blank"
                        className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors shadow-md border border-slate-300 flex items-center gap-2 font-bold text-xs"
                        title="Ver Acuerdo Legal (Términos Aceptados)"
                      >
                        <Printer className="w-4 h-4" /> Acuerdo Legal
                      </a>
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
                        <label className={`p-2 rounded-lg transition-colors shadow-md border flex items-center justify-center cursor-pointer ${pedido.guiaEnvioUrl ? 'bg-green-100 text-green-700 border-green-300' : 'bg-brand-primary text-white hover:bg-brand-accent'}`}>
                          {isUploadingGuia === pedido.id ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : pedido.guiaEnvioUrl ? (
                            <div className="flex flex-col items-center gap-1 font-bold text-xs">
                              <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); setComprobanteAmpliado(pedido.guiaEnvioUrl); }}>
                                <Eye className="w-4 h-4" /> Ver Guía
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 font-bold text-xs">
                              <Upload className="w-4 h-4" /> Subir Guía
                            </div>
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            disabled={!todasEmpaquetadas || isUploadingGuia === pedido.id} 
                            onChange={(e) => handleSubirGuia(e, pedido)} 
                          />
                        </label>
                        {pedido.guiaEnvioUrl && (
                          <label className="p-2 ml-1 cursor-pointer bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg hover:bg-brand-primary/20 shadow-sm transition-colors flex flex-col justify-center items-center" title="Reemplazar Guía">
                            <Upload className="w-4 h-4" />
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*" 
                              disabled={isUploadingGuia === pedido.id} 
                              onChange={(e) => handleSubirGuia(e, pedido)} 
                            />
                          </label>
                        )}
                        {filtroTab === 'guias' && !pedido.guiaEnvioUrl && (
                          <button 
                            title="Completar sin Guía"
                            onClick={() => setPedidoACompletar(pedido)}
                            className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors shadow-sm border border-slate-300 font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" /> Completar
                          </button>
                        )}

                        {pedido.guiaEnvioUrl && (
                          <button 
                            title="Enviar Guía por WhatsApp"
                            onClick={() => {
                              const mensaje = getWhatsAppMessage("GUIA", pedido);
                              enviarWhatsApp(pedido.celular, mensaje);
                            }}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md border border-green-600"
                          >
                            <WhatsappIcon className="w-5 h-5" />
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
          
          {visibleCount < pedidosARenderizarCompleto.length && (
            <div className="flex justify-center p-6 border-t border-surface-border">
              <button 
                onClick={cargarMas}
                className="bg-surface hover:bg-surface-border text-foreground border border-surface-border px-8 py-3 rounded-full font-bold shadow-sm transition-colors"
              >
                Cargar más pedidos ({pedidosARenderizarCompleto.length - visibleCount} restantes)
              </button>
            </div>
          )}
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
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-bold text-foreground">Bs. {pedido.total.toFixed(2)}</span>
                    <span className="text-[10px] font-medium text-foreground/60">{pedido.fecha}</span>
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
                      return (
                        <button 
                          onClick={() => setPedidoPreviewArticulos(pedido)}
                          className="w-full px-3 py-2 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm bg-surface text-foreground/70 border border-dashed border-surface-border hover:bg-surface-border/50"
                        >
                          <Eye className="w-4 h-4" /> Ver Prendas Solicitadas
                        </button>
                      );
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
                  
                  {pedido.terminosAceptados && (
                    <a href={`/admin/certificado/${pedido.id}`} target="_blank" className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4"/> Certificado
                    </a>
                  )}

                  {pedido.estado !== 'Rechazado' && !esTiendaDirecta && (
                    <button onClick={() => imprimirVineta(pedido)} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4"/> Ticket Envío
                    </button>
                  )}

                  {(!esTiendaDirecta && (pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'ENTREGADO' || filtroTab === 'guias' || filtroTab === 'historial')) && (
                    <div className="w-full flex gap-2">
                      <label className={`flex-1 text-center px-3 py-1.5 rounded-lg shadow-md font-bold text-xs flex items-center justify-center cursor-pointer border ${pedido.guiaEnvioUrl ? 'bg-green-500/20 text-green-600 border-green-500/50' : 'bg-brand-primary text-white'}`}>
                        {pedido.guiaEnvioUrl ? (
                          <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); setComprobanteAmpliado(pedido.guiaEnvioUrl); }}>
                            <Eye className="w-4 h-4" /> Ver Guía
                          </div>
                        ) : 'Subir Guía'}
                        <input type="file" className="hidden" accept="image/*" disabled={!todasEmpaquetadas || isUploadingGuia === pedido.id} onChange={(e) => handleSubirGuia(e, pedido)} />
                      </label>
                      {pedido.guiaEnvioUrl && (
                        <label className="px-3 py-1.5 cursor-pointer bg-brand-primary/10 text-brand-primary border border-brand-primary/20 rounded-lg shadow-md flex justify-center items-center" title="Reemplazar Guía">
                          <Upload className="w-4 h-4" />
                          <input type="file" className="hidden" accept="image/*" disabled={isUploadingGuia === pedido.id} onChange={(e) => handleSubirGuia(e, pedido)} />
                        </label>
                      )}
                      {pedido.guiaEnvioUrl && (
                        <button onClick={() => enviarWhatsApp(pedido.celular, getWhatsAppMessage("GUIA", pedido))} className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1da851] transition-colors text-white shadow-md rounded-lg"><WhatsappIcon className="w-4 h-4"/></button>
                      )}
                    </div>
                  )}

                  {(pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO' || pedido.estado === 'Rechazado' || pedido.guiaEnvioUrl) && (
                    <button onClick={() => reenviarWhatsApp(pedido)} className="px-3 py-1.5 bg-[#25D366] text-white hover:bg-[#1da851] rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2">
                      <WhatsappIcon className="w-4 h-4"/> Reenviar Msg
                    </button>
                  )}
                  
                  {filtroTab === 'rechazados' && (
                    <div className="flex flex-col gap-2 w-full mt-2">
                      <button onClick={() => restaurarPago(pedido)} className="px-3 py-1.5 bg-green-500 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                        <History className="w-4 h-4"/> Restaurar Pedido
                      </button>
                      <button onClick={() => borrarDefinitivamente(pedido.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-md text-xs font-bold w-full flex items-center justify-center gap-2 hover:bg-red-700 transition-colors">
                        <XCircle className="w-4 h-4"/> Borrar Definitivamente
                      </button>
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
          
          {visibleCount < pedidosARenderizarCompleto.length && (
            <div className="flex justify-center mt-4 pb-6">
              <button 
                onClick={cargarMas}
                className="bg-surface hover:bg-surface-border text-foreground border border-surface-border px-8 py-3 rounded-full font-bold shadow-sm transition-colors w-full"
              >
                Cargar más pedidos ({pedidosARenderizarCompleto.length - visibleCount} restantes)
              </button>
            </div>
          )}
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
                    Nº Cuenta: {pedidoSeleccionado.depositanteCuenta || "N/A"}
                  </p>
                  <p className="text-xs text-foreground/50 mt-0.5">
                    Cliente: {pedidoSeleccionado.cliente} (CI: {pedidoSeleccionado.ci})
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

              {pedidoSeleccionado.terminosAceptados && (
                <div className="mb-4">
                  <a 
                    href={`/admin/certificado/${pedidoSeleccionado.id}`} 
                    target="_blank"
                    className="w-full py-3 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center gap-2 border border-slate-300"
                  >
                    <Printer className="w-5 h-5" /> Ver / Imprimir Certificado Legal (PDF)
                  </a>
                </div>
              )}

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

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          variant={confirmConfig.variant}
          onConfirm={confirmConfig.onConfirm}
          onCancel={confirmConfig.onCancel}
        />
      )}

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
                {(pedidoEmpaquetando.articulos || []).map((art: any) => {
                  const prodRefMain = productos.find((p: any) => p.id === art.id);
                  return (
                  <div key={art.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${art.empaquetado ? 'bg-green-500/10 border-green-500/30' : 'bg-background border-surface-border'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center text-xl shadow-sm overflow-hidden shrink-0 bg-surface border ${art.empaquetado ? 'border-green-500' : 'border-surface-border'}`}>
                        {resolveImage(art, art.color) ? (
                          <img 
                            src={resolveImage(art, art.color)} 
                            alt={art.nombre} 
                            className={`w-full h-full object-contain bg-slate-50 cursor-zoom-in transition-opacity ${art.empaquetado ? 'opacity-60' : 'hover:opacity-80'}`} 
                            onClick={() => setComprobanteAmpliado(resolveImage(art, art.color))} 
                          />
                        ) : (
                          <span className={art.empaquetado ? 'opacity-50' : ''}>👗</span>
                        )}
                        {art.empaquetado && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-green-500/10">
                            <CheckCircle className="w-6 h-6 text-green-600 drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className={`font-bold ${art.empaquetado ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground'}`}>
                          {art.nombre} {art.isConjunto && <span className="text-[10px] ml-1 bg-black text-white px-1.5 py-0.5 rounded-sm">(Conjunto)</span>}
                        </h4>
                        {prodRefMain?.coleccion && <p className="text-[10px] text-brand-primary uppercase tracking-widest font-bold my-0.5">Colección {prodRefMain.coleccion}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Cant: {art.cantidad}</span>
                          {!art.isConjunto && (
                            <>
                              <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Talla: {art.talla}</span>
                              <span className="text-xs font-bold bg-surface-border/50 px-2 py-0.5 rounded text-foreground/70">Color: {art.color}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Detalle de piezas si es conjunto */}
                        {art.isConjunto && art.piezasDetalle && (
                          <div className="mt-3 space-y-2">
                            {Object.values(typeof art.piezasDetalle === 'string' ? JSON.parse(art.piezasDetalle) : art.piezasDetalle).map((pieza: any) => {
                              const prodRef = productos.find(p => p.id === pieza.id);
                              return (
                                <div key={pieza.id} className="flex items-center gap-2">
                                  <div className="relative group cursor-pointer" onClick={(e) => { e.stopPropagation(); setComprobanteAmpliado(resolveImage(prodRef, pieza.colorEspecifico)); }}>
                                    <img 
                                      src={resolveImage(prodRef, pieza.colorEspecifico)} 
                                      alt={prodRef?.nombre || "Prenda"} 
                                      className="w-10 h-10 object-contain bg-slate-50 rounded-md border border-surface-border transition-opacity group-hover:opacity-75" 
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none rounded-md">
                                      <Search className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="text-xs text-foreground/80">
                                    <span className="font-bold">{pieza.cantidad}x</span> {prodRef?.nombre || "Prenda"} 
                                    {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                                      <span className="block text-[10px] text-foreground/60 mt-0.5 uppercase">
                                        {pieza.tallaEspecifica && `Talla: ${pieza.tallaEspecifica}`} {pieza.tallaEspecifica && pieza.colorEspecifico && ' | '} {pieza.colorEspecifico && `Color: ${pieza.colorEspecifico}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
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
                  );
                })}
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


      {/* Modal Completar Sin Guia */}
      <AnimatePresence>
        {pedidoACompletar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 no-print">
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPedidoACompletar(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl z-10 w-full max-w-md border border-brand-primary/20"
            >
              <div className="bg-blue-50 p-6 flex flex-col items-center justify-center border-b border-blue-100">
                <div className="bg-blue-100 p-4 rounded-full mb-4 shadow-inner">
                  <CheckCircle className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">¿Completar pedido?</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 text-center text-sm">
                  Estás a punto de marcar el pedido de <strong className="text-slate-800">{pedidoACompletar.cliente}</strong> como <strong className="text-blue-600">COMPLETADO</strong> sin subir una guía de envío.
                </p>
                <p className="text-slate-500 text-center text-xs">
                  El pedido se moverá a la pestaña de <strong className="text-slate-700">Historial</strong> y se considerará entregado.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button 
                    onClick={() => setPedidoACompletar(null)}
                    className="py-3 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCompletarSinGuia}
                    className="py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Confirmar
                  </button>
                </div>
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
      {/* Modal de Previsualización de Artículos (Solo Lectura) */}
      <AnimatePresence>
        {pedidoPreviewArticulos && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg border border-surface-border overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 border-b border-surface-border bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-foreground">Prendas Solicitadas</h3>
                  <p className="text-xs text-foreground/60 font-medium">Pedido de {pedidoPreviewArticulos.cliente}</p>
                </div>
                <button onClick={() => setPedidoPreviewArticulos(null)} className="p-2 rounded-full hover:bg-surface-border/50 transition-colors">
                  <X className="w-5 h-5 text-foreground/60" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-50">
                {(pedidoPreviewArticulos.articulos || []).map((art: any, i: number) => {
                  const prodRef = productos.find(p => p.id === art.id) || art;

                  // Lógica para Combos (Conjuntos)
                  if (art.isConjunto && art.piezasDetalle) {
                    const piezas = Object.values(typeof art.piezasDetalle === 'string' ? JSON.parse(art.piezasDetalle) : art.piezasDetalle);
                    return (
                      <div key={i} className="flex flex-col p-3 bg-white rounded-xl border border-surface-border shadow-sm">
                        <div className="font-bold text-sm text-brand-primary mb-2 flex items-center gap-2">
                          <PackageCheck className="w-4 h-4" /> Combo: {art.nombre || 'Combo'}
                        </div>
                        <div className="flex flex-col gap-2 pl-2 border-l-2 border-surface-border/50 ml-2">
                          {piezas.map((pieza: any, idx: number) => {
                            const piezaRef = productos.find(p => p.id === pieza.id) || pieza;
                            const imgUrl = resolveImage(piezaRef, pieza.colorEspecifico);
                            return (
                              <div key={idx} className="flex gap-3 items-center">
                                <div 
                                  className={`w-12 h-12 rounded-lg bg-surface-border/30 overflow-hidden shrink-0 border border-surface-border/50 relative group ${imgUrl ? 'cursor-zoom-in' : ''}`}
                                  onClick={() => { if (imgUrl) setComprobanteAmpliado(imgUrl); }}
                                >
                                  {imgUrl ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={imgUrl} alt={piezaRef?.nombre || 'Prenda'} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <Search className="w-3 h-3 text-white" />
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-foreground/30"><PackageCheck className="w-4 h-4" /></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-xs text-foreground truncate"><span className="font-black text-brand-primary">{pieza.cantidad}x</span> {piezaRef?.nombre || 'Prenda'}</div>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {pieza.colorEspecifico && <span className="text-[9px] px-1.5 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md font-bold uppercase">Color: {pieza.colorEspecifico}</span>}
                                    {pieza.tallaEspecifica && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold uppercase">Talla: {pieza.tallaEspecifica}</span>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Lógica para Productos Normales
                  let imagenesParaMostrar: string[] = [];
                  const imgs = prodRef?.imagenes || art.imagenes || [];
                  if (imgs.length > 0) {
                    imagenesParaMostrar = imgs;
                  } else if (art.imagen || prodRef?.imagen) {
                    imagenesParaMostrar = [art.imagen || prodRef?.imagen];
                  } else if (art.imagenUrl) {
                    imagenesParaMostrar = [art.imagenUrl];
                  }

                  // Comprobar si hay un mapeo explícito de color a imagen
                  const hasColor = art.color && art.color !== 'N/A';
                  if (hasColor && prodRef?.imagenesPorColor) {
                    let raw = prodRef.imagenesPorColor;
                    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch(e){} }
                    if (typeof raw === 'object' && raw !== null) {
                      const keyMatch = Object.keys(raw).find(k => k.toLowerCase() === art.color.toLowerCase());
                      if (keyMatch && typeof raw[keyMatch] === 'string') {
                        // ¡Se encontró una imagen específica para este color!
                        imagenesParaMostrar = [raw[keyMatch]];
                      }
                    }
                  }

                  return (
                    <div key={i} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-surface-border shadow-sm">
                      <div className="flex gap-4 items-center">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-foreground truncate">{art.nombre || 'Prenda'}</div>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            <span className="text-[10px] px-2 py-0.5 bg-brand-primary/10 text-brand-primary rounded-md font-bold uppercase">Color: {art.color || 'N/A'}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-bold uppercase">Talla: {art.talla || 'ÚNICA'}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-surface-border text-foreground/70 rounded-md font-bold">Cant: {art.cantidad}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-1 mt-1 scrollbar-hide">
                        {imagenesParaMostrar.length > 0 ? (
                          imagenesParaMostrar.map((imgUrl, imgIdx) => (
                            <div 
                              key={imgIdx}
                              className="w-16 h-16 rounded-lg bg-surface-border/30 overflow-hidden shrink-0 border border-surface-border/50 relative group cursor-zoom-in"
                              onClick={() => setComprobanteAmpliado(imgUrl)}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imgUrl} alt={`${art.nombre || 'Prenda'} - img ${imgIdx + 1}`} className="w-full h-full object-cover transition-opacity group-hover:opacity-80" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Search className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-surface-border/30 border border-surface-border/50 flex items-center justify-center text-foreground/30">
                            <PackageCheck className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 border-t border-surface-border bg-white flex justify-end">
                <button 
                  onClick={() => setPedidoPreviewArticulos(null)}
                  className="px-6 py-2 bg-brand-primary text-white rounded-lg font-bold shadow-md hover:bg-brand-accent transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elemento de cierre necesario en map */}
      {(() => null)()}
    </div>
  );
}
