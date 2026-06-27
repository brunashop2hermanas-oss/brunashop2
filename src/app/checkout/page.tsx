"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Upload, MapPin, CreditCard, X, Search, Clock, Download, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { confirmarPagoCheckout, buscarClientaPorCI, getVenta, cancelarVentaExpirada, vincularClientaReserva, crearReservaAnonima } from "@/app/actions/ventas";
import { getConfiguracion } from "@/app/actions/config";
import { uploadImage } from "@/app/actions/upload";
import { getPrendas } from "@/app/actions/productos";
import { compressImage } from "@/lib/imageCompression";
import toast from "react-hot-toast";

const resolveImage = (item: any, colorSeleccionado?: string, fallbackIndex = 0) => {
  let img = item?.imagenes?.[fallbackIndex];
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

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryVentaId = searchParams.get("id");

  const [paso, setPaso] = useState(1);
  const [esNuevaClienta, setEsNuevaClienta] = useState(false);
  const [ci, setCi] = useState("");
  const [clientaEncontrada, setClientaEncontrada] = useState<any>(null);
  const [buscandoCi, setBuscandoCi] = useState(false);
  const [editandoClienta, setEditandoClienta] = useState(false);

  const [departamentosHabilitados, setDepartamentosHabilitados] = useState<string[]>([]);
  const [provinciasHabilitadas, setProvinciasHabilitadas] = useState<string[]>([]);
  const [municipiosHabilitados, setMunicipiosHabilitados] = useState<string[]>([]);
  const [departamento, setDepartamento] = useState("");
  
  const [receptorDiferente, setReceptorDiferente] = useState(false);
  const [empresaBus, setEmpresaBus] = useState("");

  const [ventaEnCurso, setVentaEnCurso] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tiempoExpirado, setTiempoExpirado] = useState(false);

  const [comprobante, setComprobante] = useState<File | null>(null);
  const [previewAmpliada, setPreviewAmpliada] = useState(false);
  
  const [carrito, setCarrito] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [productos, setProductos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formDataPaso2, setFormDataPaso2] = useState<any>(null);

  // Estados para datos manuales del comprobante
  const [depositanteNombres, setDepositanteNombres] = useState("");
  const [depositanteApPaterno, setDepositanteApPaterno] = useState("");
  const [depositanteApMaterno, setDepositanteApMaterno] = useState("");
  const [depositanteCi, setDepositanteCi] = useState("");
  const [depositanteCuenta, setDepositanteCuenta] = useState("");

  // Interval reference for cleanup
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    cargarDatosIniciales();
  }, [queryVentaId]);

  useEffect(() => {
    if ((paso === 1 || paso === 2) && ventaEnCurso && ventaEnCurso.expiresAt) {
      iniciarCronometro(new Date(ventaEnCurso.expiresAt), serverTimeOffset);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [paso, ventaEnCurso, serverTimeOffset]);

  const cargarDatosIniciales = async () => {
    setIsLoading(true);
    const resConfig = await getConfiguracion();
    if (resConfig.success && resConfig.data) {
      setConfig(resConfig.data);
      if (resConfig.data.destinosHabilitados) {
        const deptos = Object.keys(resConfig.data.destinosHabilitados);
        setDepartamentosHabilitados(deptos);
      }
    }
    const resProd = await getPrendas();
    if (resProd.success && resProd.data) {
      setProductos(resProd.data);
    }

    if (queryVentaId) {
      // Reanudar checkout
      const resVenta = await getVenta(queryVentaId);
      if (resVenta.success && resVenta.data) {
        const v = resVenta.data;
        const offset = resVenta.serverNow ? new Date(resVenta.serverNow).getTime() - Date.now() : 0;
        setServerTimeOffset(offset);
        
        if (v.items && v.items.length > 0) {
          const mappedCarrito = v.items.map((i: any) => ({
            id: i.prendaId,
            nombre: i.prenda?.nombre || "Prenda Reservada",
            precioVenta: i.precio,
            precioOriginal: i.prenda?.precioOriginal,
            isConjunto: i.prenda?.isConjunto,
            imagenes: i.prenda?.imagenes,
            imagenesPorColor: i.prenda?.imagenesPorColor,
            piezasDetalle: i.prenda?.piezasDetalle,
            cantidad: i.cantidad,
            tallaSeleccionada: i.talla,
            colorSeleccionado: i.color
          }));
          setCarrito(mappedCarrito);
        }

        if (v.estado === "ESPERANDO_PAGO") {
          setVentaEnCurso(v);
          if (v.clientaId) {
            setClientaEncontrada(v.clienta);
            setPaso(2);
          } else {
            // Reserva anónima
            setPaso(1);
          }
        } else if (v.estado === "PENDIENTE_VERIFICACION") {
          setPaso(3);
        } else {
          setTiempoExpirado(true);
        }
      } else {
        setTiempoExpirado(true);
      }
    } else {
      // Nuevo checkout
      const carritoGuardado = localStorage.getItem("bruna_carrito");
      if (carritoGuardado) {
        try {
          const items = JSON.parse(carritoGuardado);
          if (Array.isArray(items) && items.length > 0) setCarrito(items);
        } catch (e) { console.error("Error carrito", e); }
      }
    }
    setIsLoading(false);
  };

  const iniciarCronometro = (expiresAt: Date, offset: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = new Date(Date.now() + offset);
      const diff = expiresAt.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(timerRef.current!);
        setTimeLeft(0);
        handleExpiracion();
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);
  };

  const handleExpiracion = async () => {
    setTiempoExpirado(true);
    if (ventaEnCurso?.id) {
      await cancelarVentaExpirada(ventaEnCurso.id);
    }
  };

  const totalAPagar = carrito.reduce((sum, item) => sum + (item.precioVenta || 0), 0);
  const totalOriginal = carrito.reduce((sum, item) => {
    const precioBase = item.precioOriginal && item.precioOriginal > item.precioVenta ? item.precioOriginal : item.precioVenta;
    return sum + (precioBase || 0);
  }, 0);
  const ahorroTotal = totalOriginal - totalAPagar;

  const handleBuscarClienta = async () => {
    if (!ci) return;
    setBuscandoCi(true);
    const res = await buscarClientaPorCI(ci);
    setBuscandoCi(false);
    if (res.success && res.data) {
      setClientaEncontrada(res.data);
    } else {
      toast.error("No encontramos tu carnet. Por favor, regístrate como Nueva Clienta (¡es súper rápido!).");
      setEsNuevaClienta(true);
    }
  };

  const handleDeptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDepartamento(val);
    if (config?.destinosHabilitados && config.destinosHabilitados[val]) {
      // Migración si está en formato viejo (array) o formato nuevo (objeto)
      const data = config.destinosHabilitados[val];
      if (Array.isArray(data)) {
        setProvinciasHabilitadas(data);
        setMunicipiosHabilitados([]);
      } else {
        setProvinciasHabilitadas(data.provincias || []);
        setMunicipiosHabilitados(data.municipios || []);
      }
    } else {
      setProvinciasHabilitadas([]);
      setMunicipiosHabilitados([]);
    }
  };

  const handleGuardarEdicion = () => {
    const form = document.getElementById('paso1-form') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const nn = formData.get("nombres") as string;
    const ap = formData.get("apellidoPaterno") as string;
    const am = formData.get("apellidoMaterno") as string;
    const cel = formData.get("celular") as string;
    const newCi = (formData.get("ci") as string) || ci;
    
    if (!nn || !ap || !cel || !newCi) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }
    
    setClientaEncontrada({
      ...clientaEncontrada,
      id: clientaEncontrada?.id || "",
      nombres: nn,
      apellidos: `${ap} ${am || ""}`.trim(),
      celular: cel,
      ci: newCi,
      puntos: clientaEncontrada?.puntos || 0,
      nivel: clientaEncontrada?.nivel || "Bronce",
      createdAt: clientaEncontrada?.createdAt || new Date(),
    });
    setCi(newCi);
    setEditandoClienta(false);
    toast.success("¡Datos actualizados para este pedido!");
  };

  const procesarPaso1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const ciudadDestino = formData.get("ciudadDestino") as string;
    const provinciaDestino = formData.get("provinciaDestino") as string;
    const municipioDestino = formData.get("municipioDestino") as string;
    
    let ventaActualId = ventaEnCurso?.id;

    setIsSubmitting(true);

    try {
      if (!ventaActualId) {
        if (carrito.length === 0) {
          setIsSubmitting(false);
          return toast.error("¡Ups! Tu carrito está vacío.");
        }
        
        const resTemp = await crearReservaAnonima({
          items: carrito.map(item => ({
            prendaId: item.id,
            cantidad: item.cantidad || 1,
            precioUnitario: item.precioVenta,
            talla: typeof item.tallaSeleccionada === 'object' ? JSON.stringify(item.tallaSeleccionada) : (item.tallaSeleccionada || undefined),
            color: typeof item.colorSeleccionado === 'object' ? JSON.stringify(item.colorSeleccionado) : (item.colorSeleccionado || undefined)
          })),
          total: totalAPagar
        });
        
        if (!resTemp.success || !resTemp.data) {
          setIsSubmitting(false);
          return toast.error(resTemp.error || "Error al reservar el stock. Por favor intenta de nuevo.");
        }
        ventaActualId = resTemp.data.id;
      }

      let clientIp = "";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        clientIp = ipData.ip;
      } catch(e) {
        clientIp = "IP local/Desconocida";
      }
      const dataToSend = {
        nombres: (formData.get("nombres") as string) || clientaEncontrada?.nombres,
        apellidoPaterno: (formData.get("apellidoPaterno") as string) || clientaEncontrada?.apellidos,
        apellidoMaterno: (formData.get("apellidoMaterno") as string) || "",
        celular: (formData.get("celular") as string) || clientaEncontrada?.celular,
        ci: ci || (formData.get("ci") as string),
        ciudadDestino: ciudadDestino,
        provinciaDestino: provinciaDestino || "",
        municipioDestino: municipioDestino || "",
        receptorDiferente: receptorDiferente,
        receptorNombres: receptorDiferente ? (formData.get("receptorNombres") as string) : "",
        receptorApPaterno: receptorDiferente ? (formData.get("receptorApPaterno") as string) : "",
        receptorApMaterno: receptorDiferente ? (formData.get("receptorApMaterno") as string) : "",
        receptorCi: receptorDiferente ? (formData.get("receptorCi") as string) : "",
        receptorCelular: receptorDiferente ? (formData.get("receptorCelular") as string) : "",
        empresaBusesPreferida: empresaBus,
        tiempoReservaMinutos: config?.tiempoReservaMinutos || 4,
        clientIp: clientIp
      };

      const res = await vincularClientaReserva(ventaActualId, dataToSend);
      setIsSubmitting(false);

      if (res.success && res.data) {
        setVentaEnCurso(res.data);
        router.replace(`/checkout?id=${res.data.id}`);
        setPaso(2);
        localStorage.removeItem("bruna_carrito");
      } else {
        toast.error("¡Uy! Tuvimos un problemita al preparar tu reserva. Por favor, intenta de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      toast.error("Ocurrió un error inesperado al procesar tu solicitud.");
    }
  };

  const attemptProcesarPaso2 = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ventaEnCurso) return;
    if (!comprobante) return toast.error("¡No olvides subir la foto de tu comprobante de pago!");

    const formData = new FormData(e.currentTarget);
    setFormDataPaso2({
      depositanteNombres: formData.get("depositanteNombres") as string,
      depositanteApPaterno: formData.get("depositanteApPaterno") as string,
      depositanteApMaterno: formData.get("depositanteApMaterno") as string,
      depositanteCi: formData.get("depositanteCi") as string,
      depositanteCuenta: formData.get("depositanteCuenta") as string,
    });
    
    setShowConfirmModal(true);
  };

  const ejecutarProcesarPaso2 = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true); // Mostramos el overlay de carga bloqueando la pantalla
    
    let comprobanteRealUrl = "";
    try {
      const compressedFile = await compressImage(comprobante!, 'baja'); 
      const fileData = new FormData();
      fileData.append("file", compressedFile);
      const resUpload = await uploadImage(fileData);
      if (resUpload.success && resUpload.url) {
        comprobanteRealUrl = resUpload.url;
      } else {
        setIsSubmitting(false);
        toast.error("Tu comprobante no se pudo subir. Por favor envíalo por WhatsApp.");
        return;
      }
    } catch (err) {
      setIsSubmitting(false);
      toast.error("Tuvimos un problemita con tu foto. Por favor envíalo por WhatsApp.");
      return;
    }

    const reqData = {
      comprobanteUrl: comprobanteRealUrl,
      depositanteNombres: depositanteNombres || formDataPaso2?.depositanteNombres,
      depositanteApPaterno: depositanteApPaterno || formDataPaso2?.depositanteApPaterno,
      depositanteApMaterno: depositanteApMaterno || formDataPaso2?.depositanteApMaterno,
      depositanteCi: depositanteCi || formDataPaso2?.depositanteCi,
      depositanteCuenta: depositanteCuenta || formDataPaso2?.depositanteCuenta,
    };

    const res = await confirmarPagoCheckout(ventaEnCurso.id, reqData);
    setIsSubmitting(false);
    
    if (res.success) {
      setPaso(3);
    } else {
      toast.error("Hubo un inconveniente confirmando tu pago en el sistema. Por favor, avísanos por WhatsApp.");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <span className="text-xs tracking-[0.2em] uppercase text-foreground/50 animate-pulse">Cargando...</span>
      </div>
    );
  }

  if (tiempoExpirado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-600/95 backdrop-blur-md px-4">
        <div className="bg-white p-12 text-center rounded-3xl shadow-2xl max-w-xl w-full flex flex-col items-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black uppercase mb-4 text-red-600 tracking-tighter leading-none">
            ¡Tiempo<br />Expirado!
          </h2>
          <p className="text-gray-600 text-lg md:text-xl mb-10 max-w-md">
            El tiempo límite para completar tu reserva ha finalizado. Tus prendas han sido liberadas para otras clientas.
          </p>
          <Link href="/">
            <button className="bg-black hover:bg-gray-800 text-white px-10 py-5 uppercase tracking-[0.2em] text-sm font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 w-full md:w-auto">
              Volver al Catálogo
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-black selection:text-white pb-20">
      <header className="w-full border-b border-black/10">
        <div className="max-w-[1600px] mx-auto px-4 md:px-12 h-24 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-50 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Volver</span>
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tighter uppercase">BrunaShop2</h1>
          <div className="w-16">
            {paso === 2 && (
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold text-red-500">Expira en</span>
                <span className="font-mono text-xl text-red-600 font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-12 py-12 md:py-16">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          <div className="w-full lg:flex-1">
            <AnimatePresence mode="wait">
              {paso === 1 && (
                <motion.div key="paso1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">1</div>
                  <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest">Identificación y Envío</h2>
                </div>

                {!clientaEncontrada && !esNuevaClienta && (
                  <div className="bg-surface border border-black/10 p-8 rounded-xl space-y-6 mb-8 shadow-sm">
                    <h3 className="text-xl font-bold">¿Ya tienes cuenta?</h3>
                    <p className="text-sm text-foreground/70">Ingresa tu Carnet de Identidad para buscar tus datos y acelerar tu compra.</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <input 
                        type="text" value={ci} onChange={e=>setCi(e.target.value)} 
                        placeholder="Ej: 1234567" 
                        className="flex-1 bg-background border border-black/20 p-3 outline-none focus:border-black"
                      />
                      <button onClick={handleBuscarClienta} disabled={buscandoCi} className="bg-black text-white p-3 font-bold uppercase tracking-wider hover:bg-brand-primary disabled:opacity-50 flex items-center justify-center gap-2 sm:px-6">
                        {buscandoCi ? "Buscando..." : <><Search className="w-4 h-4"/> Buscar</>}
                      </button>
                    </div>
                    <div className="text-center pt-4 border-t border-black/10">
                      <span className="text-sm text-foreground/50">¿Es tu primera vez comprando?</span>
                      <button onClick={() => setEsNuevaClienta(true)} className="block w-full mt-3 border border-black py-3 uppercase tracking-widest font-bold hover:bg-black hover:text-white transition-colors">
                        Soy Nueva Clienta (Registrarme)
                      </button>
                    </div>
                  </div>
                )}

                {(clientaEncontrada || esNuevaClienta) && (
                  <form id="paso1-form" onSubmit={procesarPaso1} className="space-y-10">
                    <div className="bg-brand-primary/5 border border-brand-primary/20 p-6 rounded-xl">
                      {clientaEncontrada && !editandoClienta ? (
                        <div>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                            <h3 className="text-xl font-bold text-brand-primary">¡Bienvenida de nuevo, {clientaEncontrada.nombres}!</h3>
                            <button type="button" onClick={() => setEditandoClienta(true)} className="text-xs font-bold uppercase tracking-widest bg-black text-white px-5 py-2 hover:bg-black/80 transition-colors">Editar mis datos</button>
                          </div>
                          <p className="text-sm">Tus datos están guardados. Solo dinos a dónde enviamos tu pedido.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <h3 className="text-lg font-bold uppercase tracking-widest border-b border-black/10 pb-3">
                            {editandoClienta ? "Actualizar mis datos" : "Registro de Clienta"}
                          </h3>
                          {editandoClienta && (
                            <p className="text-xs text-foreground/60 mb-2">Modifica los campos que necesites corregir o actualizar.</p>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Nombres</label>
                              <input name="nombres" defaultValue={clientaEncontrada?.nombres || ""} required type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Ap. Paterno</label>
                              <input name="apellidoPaterno" defaultValue={clientaEncontrada?.apellidos?.split(' ')[0] || ""} required type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Ap. Materno (Opc.)</label>
                              <input name="apellidoMaterno" defaultValue={clientaEncontrada?.apellidos?.split(' ').slice(1).join(' ') || ""} type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Carnet (C.I.)</label>
                              <input name="ci" required type="text" value={ci} onChange={e=>setCi(e.target.value)} className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Celular / WhatsApp</label>
                              <input name="celular" defaultValue={clientaEncontrada?.celular || ""} required type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                            </div>
                          </div>
                          {editandoClienta && (
                            <div className="flex justify-end pt-4 gap-4 border-t border-black/10 mt-6">
                              <button type="button" onClick={() => setEditandoClienta(false)} className="text-xs uppercase tracking-widest font-bold text-foreground/50 hover:text-black px-4 py-2 transition-colors">Cancelar</button>
                              <button type="button" onClick={handleGuardarEdicion} className="text-xs uppercase tracking-widest font-bold bg-brand-primary text-white px-6 py-2 hover:bg-brand-primary/90 transition-colors">Guardar datos</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2 border-b border-black/10 pb-3">
                        <MapPin className="w-5 h-5"/> Destino del Paquete
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Departamento</label>
                          <select name="ciudadDestino" required value={departamento} onChange={handleDeptoChange} className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black cursor-pointer rounded-none appearance-none">
                            <option value="" disabled>Seleccionar...</option>
                            {departamentosHabilitados.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                        {provinciasHabilitadas.length > 0 && (
                          <div>
                            <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Provincia (Opcional)</label>
                            <select name="provinciaDestino" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black cursor-pointer rounded-none appearance-none">
                              <option value="">Ninguna...</option>
                              {provinciasHabilitadas.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                          </div>
                        )}
                        {municipiosHabilitados.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Municipio / Localidad (Opcional)</label>
                            <select name="municipioDestino" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black cursor-pointer rounded-none appearance-none">
                              <option value="">Ninguno...</option>
                              {municipiosHabilitados.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                        )}
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-black/10">
                          <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Empresa de Buses de Preferencia (Opcional)</label>
                          <input type="text" value={empresaBus} onChange={e => setEmpresaBus(e.target.value)} placeholder="Ej. Trans Copacabana, Bolívar, etc." className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                        </div>
                      </div>

                      <div className="mt-8 bg-surface border border-surface-border p-6 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={receptorDiferente} onChange={e => setReceptorDiferente(e.target.checked)} className="w-5 h-5 accent-brand-primary" />
                          <span className="font-bold text-sm uppercase tracking-widest">¿Otra persona recibirá o recogerá el envío?</span>
                        </label>
                        
                        <AnimatePresence>
                          {receptorDiferente && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-black/10">
                                <div>
                                  <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Nombres de la persona que recibirá</label>
                                  <input name="receptorNombres" required={receptorDiferente} type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                                </div>
                                <div>
                                  <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Ap. Paterno de la persona</label>
                                  <input name="receptorApPaterno" required={receptorDiferente} type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                                </div>
                                <div>
                                  <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Ap. Materno de la persona (Opc.)</label>
                                  <input name="receptorApMaterno" type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                                </div>
                                <div>
                                  <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Carnet (C.I.) de la persona</label>
                                  <input name="receptorCi" required={receptorDiferente} type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                                </div>
                                <div>
                                  <label className="block text-xs uppercase tracking-widest mb-2 font-bold">Celular de la persona</label>
                                  <input name="receptorCelular" required={receptorDiferente} type="text" className="w-full bg-transparent border-b border-black/20 py-2 outline-none focus:border-black" />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-4 text-xs flex items-start gap-3 rounded-xl">
                      <Clock className="w-5 h-5 shrink-0" />
                      <p><strong>Aviso:</strong> Al hacer clic en "Siguiente", tus prendas serán reservadas y descontadas del inventario durante <strong>{config?.tiempoReservaMinutos} minutos</strong> para que puedas realizar tu pago tranquilamente.</p>
                    </div>

                    <div className="flex items-start gap-3 py-2">
                      <input 
                        type="checkbox" 
                        required 
                        id="terms-checkbox"
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                      />
                      <label htmlFor="terms-checkbox" className="text-sm text-foreground/80 cursor-pointer select-none">
                        He leído y acepto los <Link href="/terminos" target="_blank" className="font-bold underline hover:text-brand-primary">Términos y Condiciones</Link> y la <Link href="/privacidad" target="_blank" className="font-bold underline hover:text-brand-primary">Política de Privacidad</Link>.
                      </label>
                    </div>

                    <button disabled={isSubmitting} className="w-full bg-black text-white py-5 text-sm uppercase tracking-[0.2em] font-bold hover:bg-brand-primary transition-colors">
                      {isSubmitting ? "Reservando Stock..." : "Siguiente: Realizar Pago"}
                    </button>
                  </form>
                )}
            </motion.div>
          )}

          {paso === 2 && (
            <motion.div key="paso2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-black/10 pb-6 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">2</div>
                  <h2 className="text-2xl md:text-3xl font-light uppercase tracking-widest">Pago y Comprobante</h2>
                </div>
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse shadow-sm">
                  <Clock className="w-5 h-5"/>
                  Tienes {formatTime(timeLeft)} para completar el pago
                </div>
              </div>

              <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-xl mb-10 text-sm flex gap-3 text-yellow-800 shadow-sm">
                <AlertTriangle className="w-6 h-6 shrink-0 text-yellow-600"/>
                <p><strong>Por favor:</strong> Si vas a usar la app de tu banco, te recomendamos descargar la imagen del QR. <strong>Trata de no cerrar ni refrescar esta ventana.</strong> Si tu celular la cierra, puedes volver al mismo link y retomar.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="bg-surface p-8 rounded-2xl border border-surface-border shadow-md flex flex-col items-center justify-center text-center">
                  <h3 className="text-lg uppercase tracking-widest font-bold mb-6 border-b pb-2">Escanea para Pagar</h3>
                  <div className="w-56 h-56 bg-white p-2 border shadow-lg mb-6 relative group">
                    {config?.qrImagen ? (
                      <>
                        <Image fill sizes="(max-width: 768px) 100vw, 50vw" src={config.qrImagen} alt="QR" className="w-full h-full object-contain" />
                        <a href={config.qrImagen} download="QR_BrunaShop.jpg" className="absolute inset-0 bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex flex-col items-center gap-2"><Download className="w-8 h-8"/> <span className="text-xs uppercase font-bold tracking-widest">Descargar QR</span></div>
                        </a>
                      </>
                    ) : (
                      <span className="text-xs text-foreground/40">Sin QR</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase text-foreground/50 tracking-widest">Monto a pagar</p>
                    <p className="text-3xl font-bold text-brand-primary">Bs. {ventaEnCurso?.total?.toFixed(2)}</p>
                    <div className="pt-4 mt-4 border-t border-black/10">
                      <p className="text-sm font-medium">{config?.bancoNombre}</p>
                      <p className="text-lg font-mono">{config?.bancoCuenta}</p>
                      <p className="text-xs text-foreground/50 uppercase">{config?.bancoTitular}</p>
                    </div>
                  </div>
                </div>

                <div className="lg:w-[600px]">
                <form id="paso2-form" onSubmit={attemptProcesarPaso2} className="space-y-12 pb-12">
                  <div className="bg-white p-6 rounded-2xl border border-surface-border shadow-sm">
                    <h3 className="text-sm uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-brand-primary"/> Datos del Depositante
                    </h3>
                    <div className="bg-red-50/80 border border-red-200 p-4 rounded-xl mb-6 text-sm flex gap-3 text-red-800 shadow-sm">
                      <AlertTriangle className="w-8 h-8 shrink-0 text-red-600"/>
                      <p>
                        <strong>MUY IMPORTANTE:</strong> Los datos que ingreses aquí <strong>deben coincidir exactamente</strong> con el titular de la cuenta bancaria desde donde estás transfiriendo. <br/><br/>
                        <span className="underline font-bold">Si los datos no coinciden, no podremos verificar ni despachar tu compra.</span>
                      </p>
                    </div>

                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs uppercase font-bold mb-1">Nombre(s) del Titular de la Cuenta *</label>
                        <input required name="depositanteNombres" value={depositanteNombres} onChange={(e) => setDepositanteNombres(e.target.value)} type="text" className="w-full border-b border-black/20 bg-transparent py-2 outline-none focus:border-brand-primary" placeholder="Ej: Maria Renee" />
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs uppercase font-bold mb-1">Ap. Paterno *</label>
                          <input required name="depositanteApPaterno" value={depositanteApPaterno} onChange={(e) => setDepositanteApPaterno(e.target.value)} type="text" className="w-full border-b border-black/20 bg-transparent py-2 outline-none focus:border-brand-primary" placeholder="Ej: Perez" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs uppercase font-bold mb-1">Ap. Materno</label>
                          <input name="depositanteApMaterno" value={depositanteApMaterno} onChange={(e) => setDepositanteApMaterno(e.target.value)} type="text" className="w-full border-b border-black/20 bg-transparent py-2 outline-none focus:border-brand-primary" placeholder="Ej: Lopez" />
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <label className="block text-xs uppercase font-bold mb-1">C.I. (Opcional)</label>
                          <input name="depositanteCi" value={depositanteCi} onChange={(e) => setDepositanteCi(e.target.value)} type="text" className="w-full border-b border-black/20 bg-transparent py-2 outline-none focus:border-brand-primary" placeholder="Ej: 1234567" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs uppercase font-bold mb-1">Nº Cuenta (Opcional)</label>
                          <input name="depositanteCuenta" value={depositanteCuenta} onChange={(e) => setDepositanteCuenta(e.target.value)} type="text" className="w-full border-b border-black/20 bg-transparent py-2 outline-none focus:border-brand-primary" placeholder="Ej: 1000123456" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 items-center">
                    <div className="relative group overflow-hidden border border-black rounded-2xl w-full">
                      <input 
                        id="comprobante-input"
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          if(e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setComprobante(file);
                          }
                        }} 
                        className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" 
                      />
                      <div className={`p-8 text-center transition-all ${comprobante ? 'bg-black text-white p-0' : 'bg-transparent text-black hover:bg-black/5'}`}>
                        {comprobante ? (
                          <div className="relative w-full h-48 bg-black flex flex-col items-center justify-center">
                            <Image fill sizes="(max-width: 768px) 100vw, 50vw" 
                              src={URL.createObjectURL(comprobante)} 
                              alt="Vista previa" 
                              className="absolute inset-0 w-full h-full object-contain opacity-60"
                            />
                            <div className="relative z-10 flex flex-col items-center gap-2">
                              <Check className="w-10 h-10 text-green-400 drop-shadow-md" />
                              <span className="block font-bold text-sm uppercase drop-shadow-md">¡Comprobante Listo!</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewAmpliada(true); }}
                              className="absolute top-2 right-2 z-30 bg-black/70 text-white p-2 rounded-full hover:bg-black transition-colors backdrop-blur-md"
                              title="Ampliar imagen"
                            >
                              <Search className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 cursor-pointer">
                            <Upload className="w-8 h-8 text-brand-primary" />
                            <span className="text-sm font-bold uppercase">Subir Captura de Pago</span>
                            <span className="text-xs text-foreground/50">Toca aquí para seleccionar</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {comprobante && (
                      <button 
                        type="button" 
                        onClick={() => document.getElementById('comprobante-input')?.click()}
                        className="text-xs font-bold text-brand-primary uppercase underline hover:text-black transition-colors py-2 px-4 bg-brand-primary/10 rounded-full"
                      >
                        Cambiar Imagen
                      </button>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-[10px] text-foreground/60 mb-4 px-2">
                      Al completar tu compra, aceptas que tus datos y la imagen del comprobante serán procesados de forma segura conforme a nuestra <Link href="/privacidad" target="_blank" className="underline font-bold hover:text-black">Política de Privacidad</Link>, exclusivamente para la verificación de tu pago.
                    </p>

                    <div className="flex justify-end pt-6 border-t border-black/10">
                      <button 
                        type="submit" 
                        disabled={isSubmitting || !comprobante} 
                        className="w-full md:w-auto bg-black text-white px-8 py-4 font-bold uppercase tracking-widest hover:bg-brand-primary transition-colors disabled:opacity-50"
                      >
                        {isSubmitting ? "Verificando..." : "Finalizar Compra"}
                      </button>
                    </div>
                  </div>
                </form>
                </div>
              </div>
            </motion.div>
          )}

          {paso === 3 && (
            <motion.div key="paso3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-24 text-center">
              <div className="w-24 h-24 border border-black rounded-full flex items-center justify-center mx-auto mb-10">
                <Check className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-4xl md:text-5xl font-light mb-6 uppercase tracking-widest">¡Pago Recibido!</h2>
              <p className="text-lg text-foreground/70 mb-12 font-light max-w-2xl mx-auto">
                Tu comprobante ya fue enviado con éxito. Te confirmaremos tu compra mediante WhatsApp en breve, ¡gracias por elegirnos!
              </p>
              <Link href="/">
                <button className="bg-black text-white px-12 py-5 text-sm uppercase tracking-[0.2em] font-bold hover:bg-brand-primary transition-colors">
                  Volver al Catálogo
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {paso < 3 && !tiempoExpirado && (
          <div className="w-full lg:w-[400px] shrink-0 sticky top-12 bg-surface border border-surface-border p-8 mt-12 lg:mt-0 order-last mb-10 lg:mb-0">
            <h3 className="text-sm uppercase tracking-widest font-bold mb-6 pb-4 border-b">Resumen</h3>
            <div className="space-y-4">
              {carrito.map((item, idx) => (
                <div key={idx} className="flex gap-4 border-b border-surface-border pb-4">
                  <div className="shrink-0 relative group cursor-pointer w-16 h-20" onClick={() => setImagenAmpliada(resolveImage(item, item.colorSeleccionado))}>
                    <Image fill sizes="(max-width: 768px) 100vw, 50vw" 
                      src={resolveImage(item, item.colorSeleccionado)} 
                      alt={item.nombre} 
                      className="object-contain bg-slate-50 rounded-sm border border-black/10 transition-opacity group-hover:opacity-75" 
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-foreground text-sm uppercase leading-tight">{item.cantidad || 1}x {item.nombre} {item.isConjunto && <span className="text-[10px] ml-1 bg-black text-white px-1.5 py-0.5 rounded-sm">(Conjunto)</span>}</h3>
                        {item.prenda?.coleccion && <p className="text-[10px] text-brand-primary uppercase tracking-widest font-bold mt-0.5">Colección {item.prenda.coleccion}</p>}
                        {(item.tallaSeleccionada || item.colorSeleccionado) && (
                          <p className="text-[10px] text-foreground/50 mt-0.5 uppercase font-medium tracking-wide">
                            {item.tallaSeleccionada && `Talla: ${item.tallaSeleccionada}`}
                            {item.tallaSeleccionada && item.colorSeleccionado && ' | '}
                            {item.colorSeleccionado && `Color: ${item.colorSeleccionado}`}
                          </p>
                        )}
                        {item.isConjunto && item.piezasDetalle && (
                          <div className="mt-3 space-y-2">
                            {Object.values(typeof item.piezasDetalle === 'string' ? JSON.parse(item.piezasDetalle) : item.piezasDetalle).map((pieza: any) => {
                              const prodRef = productos.find(p => p.id === pieza.id);
                              return (
                                <div key={pieza.id} className="flex items-center gap-2">
                                  <div className="relative group cursor-pointer w-8 h-10" onClick={() => setImagenAmpliada(resolveImage(prodRef, pieza.colorEspecifico))}>
                                    <Image fill sizes="(max-width: 768px) 100vw, 50vw" 
                                      src={resolveImage(prodRef, pieza.colorEspecifico)} 
                                      alt={prodRef?.nombre || "Prenda"} 
                                      className="object-contain bg-slate-50 rounded-sm border border-black/10 transition-opacity group-hover:opacity-75" 
                                    />
                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                                      <Search className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-foreground/70 uppercase">
                                    <span className="font-bold">{pieza.cantidad}x</span> {prodRef?.nombre || "Prenda"} 
                                    {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                                      <span className="block text-[9px] text-foreground/50 mt-0.5">
                                        {pieza.tallaEspecifica && `Talla: ${pieza.tallaEspecifica} `}
                                        {pieza.colorEspecifico && `| Color: ${pieza.colorEspecifico}`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-sm">Bs. {item.precioVenta.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-surface-border pt-4 mt-6">
              {ahorroTotal > 0 && (
                <div className="flex justify-between text-sm mb-2 text-foreground/60">
                  <span>Total Regular</span>
                  <span className="line-through">Bs. {totalOriginal.toFixed(2)}</span>
                </div>
              )}
              {ahorroTotal > 0 && (
                <div className="flex justify-between text-sm mb-4 text-green-600 font-bold">
                  <span>Ahorro</span>
                  <span>- Bs. {ahorroTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span className="uppercase tracking-widest">TOTAL</span>
                <span>Bs. {totalAPagar.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {imagenAmpliada && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setImagenAmpliada(null)}
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-gray-300 p-2"
              onClick={() => setImagenAmpliada(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <Image fill sizes="(max-width: 768px) 100vw, 50vw" 
              src={imagenAmpliada} 
              alt="Ampliada" 
              className="max-w-full max-h-full object-contain cursor-zoom-out" 
              onClick={(e) => { e.stopPropagation(); setImagenAmpliada(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewAmpliada && comprobante && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPreviewAmpliada(false)}
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-gray-300 p-2"
              onClick={() => setPreviewAmpliada(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <Image fill sizes="(max-width: 768px) 100vw, 50vw" 
              src={URL.createObjectURL(comprobante)} 
              alt="Comprobante Ampliado" 
              className="max-w-full max-h-full object-contain cursor-zoom-out" 
              onClick={(e) => { e.stopPropagation(); setPreviewAmpliada(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
        {isSubmitting && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white px-4">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold uppercase tracking-widest text-center">Procesando tu pedido...</h3>
            <p className="text-sm text-white/70 mt-3 text-center max-w-sm">
              Por favor, no cierres esta ventana ni presiones atrás mientras {paso === 1 ? 'reservamos tus prendas' : 'confirmamos tu comprobante de forma segura'}.
            </p>
          </div>
        )}

        <AnimatePresence>
          {showConfirmModal && comprobante && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-6 md:p-10 rounded-3xl max-w-lg w-full flex flex-col items-center text-center relative"
              >
                <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 text-black/50 hover:text-black">
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-2xl font-black uppercase mb-2">Verifica tu Imagen</h3>
                <p className="text-foreground/70 mb-6 text-sm">¿Estás segura de que esta es la imagen correcta de tu transferencia?</p>
                
                <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden mb-8 border border-black/10">
                  <Image 
                    fill 
                    sizes="(max-width: 768px) 100vw, 50vw" 
                    src={URL.createObjectURL(comprobante)} 
                    alt="Previsualización de Comprobante" 
                    className="object-contain"
                  />
                </div>
                
                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={ejecutarProcesarPaso2}
                    className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:bg-brand-primary transition-colors rounded-xl"
                  >
                    Sí, Enviar Pedido
                  </button>
                  <button 
                    onClick={() => {
                      setShowConfirmModal(false);
                      document.getElementById('comprobante-input')?.click();
                    }}
                    className="w-full py-4 bg-gray-100 text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-xl"
                  >
                    No, Cambiar Foto
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="animate-pulse tracking-widest">Cargando Checkout...</span></div>}>
      <CheckoutContent />
    </Suspense>
  );
}