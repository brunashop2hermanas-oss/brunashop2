"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, X, Trash2, Search, Video } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPrendas } from "@/app/actions/productos";
import { getConfiguracion } from "@/app/actions/config";
import { crearReservaAnonima } from "@/app/actions/ventas";
import hotToast from "react-hot-toast";

export default function CatalogoProductos({ liveActivoBanner, setLiveActivoBanner }: { liveActivoBanner?: boolean, setLiveActivoBanner?: (v: boolean) => void }) {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>(["Todas"]);
  const [isLoading, setIsLoading] = useState(true);
  const [liveActivo, setLiveActivo] = useState(false);
  
  const [carrito, setCarrito] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [tiktokUrl, setTiktokUrl] = useState("");
  const router = useRouter();
  
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resProd, resConf] = await Promise.all([getPrendas(), getConfiguracion()]);
        
        if (resProd.success) {
          setProductos(resProd.data || []);
          const cats = Array.from(new Set((resProd.data || []).map((p: any) => p.categoria).filter(Boolean))) as string[];
          setCategorias(["Todas", ...cats]);
        }
        
        if (resConf.success && resConf.data) {
          setLiveActivo(resConf.data.liveActivo || false);
          setTiktokUrl(resConf.data.tiktokUrl || "");
          if (setLiveActivoBanner) {
            setLiveActivoBanner(resConf.data.liveActivo || false);
          }
        }
      } catch (e) {}
      setIsLoading(false);
    };
    fetchData();

    const intervalo = setInterval(() => {
      fetchData();
    }, 10000); 

    return () => clearInterval(intervalo);
  }, []);

  const productosLive = liveActivo ? productos.filter(p => p.enLive && p.stockCount > 0) : [];
  const productosFiltrados = productos.filter(p => (!p.enLive || !liveActivo) && (filtroCategoria === "Todas" || p.categoria === filtroCategoria) && p.stockCount > 0);

  const mostrarToast = (mensaje: string) => {
    setToast(mensaje);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const abrirVistaRapida = (producto: any) => {
    setProductoSeleccionado(producto);
  };

  const cerrarVistaRapida = () => {
    setProductoSeleccionado(null);
  };

  const agregarAlCarritoRapido = (producto: any) => {
    // Si tiene tallas o colores, forzamos la vista rápida para que seleccione
    if ((producto.tallas && producto.tallas.length > 0) || (producto.colores && producto.colores.length > 0)) {
      abrirVistaRapida(producto);
      return;
    }

    agregarAlCarritoDesdeModal(producto, "", "");
  };

  const agregarAlCarritoDesdeModal = (producto: any, talla: string, color: string) => {
    const cantidadEnCarrito = carrito.filter(item => item.id === producto.id).length;

    if (cantidadEnCarrito >= producto.stockCount && producto.stockCount > 0) {
      mostrarToast(`AGOTADO. SOLO QUEDAN ${producto.stockCount} UNIDADES DE "${producto.nombre.toUpperCase()}".`);
    } else {
      // Usamos un identificador único para el item en el carrito
      const itemUnicoId = `${producto.id}-${talla}-${color}-${Date.now()}`;
      setCarrito([...carrito, { ...producto, itemUnicoId, tallaSeleccionada: talla, colorSeleccionado: color }]);
      mostrarToast(`AÑADIDO A LA BOLSA: ${producto.nombre.toUpperCase()}`);
      cerrarVistaRapida();
      setIsCartOpen(true); // Abrimos el carrito automáticamente para mostrar lo que lleva
    }
  };

  const eliminarDelCarrito = (itemUnicoId: string) => {
    setCarrito(carrito.filter(item => item.itemUnicoId !== itemUnicoId));
  };

  const totalCarrito = carrito.reduce((sum, item) => sum + (item.precioVenta || 0), 0);
  const totalOriginalCarrito = carrito.reduce((sum, item) => sum + (item.precioOriginal && item.precioOriginal > item.precioVenta ? item.precioOriginal : item.precioVenta || 0), 0);
  const ahorroTotal = totalOriginalCarrito - totalCarrito;

  if (isLoading) {
    return (
      <div className="w-full min-h-[50vh] flex justify-center items-center bg-[#fcfcfc]">
        <div className="w-8 h-8 border-[2px] border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <section className="w-full bg-[#fcfcfc] min-h-screen text-black pb-20 overflow-hidden">
      
      {/* Toast Notificación */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-black text-white px-6 py-3 text-xs tracking-widest uppercase font-medium shadow-2xl rounded-full flex items-center gap-3 w-11/12 max-w-md justify-center text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 border-b border-gray-100 pb-6 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-5xl font-serif text-black mb-2">Catálogo</h2>
            <p className="text-gray-400 text-xs tracking-widest uppercase">Explora nuestras categorías</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div 
              className="relative group flex items-center justify-center cursor-pointer p-2"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="w-6 h-6 text-black" strokeWidth={1.5} />
              {carrito.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                  {carrito.length}
                </span>
              )}
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-black text-white text-xs uppercase tracking-widest font-medium px-6 py-3 hover:bg-gray-800 transition-colors flex items-center gap-2 rounded-sm"
            >
              Ir a la Bolsa <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Categorías Flotantes / Estilo Píldora (Mobile-first) */}
        <div className="flex overflow-x-auto pb-4 mb-10 gap-3 scrollbar-hide">
          {categorias.map(cat => (
            <button 
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`whitespace-nowrap px-6 py-2.5 text-xs tracking-widest uppercase transition-all rounded-full border ${
                filtroCategoria === cat 
                  ? "border-black bg-black text-white font-medium shadow-md" 
                  : "border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Productos Live y TikTok Embed */}
        {liveActivo && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6 border-b border-red-100 pb-2">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
              <h3 className="text-lg font-bold tracking-widest uppercase text-red-600">En Live Ahora</h3>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Sección Izquierda: TikTok iframe (aparece al lado) */}
              {tiktokUrl && tiktokUrl.includes("tiktok.com/@") && (
                <div className="lg:w-[350px] w-full shrink-0">
                  <div className="bg-black rounded-xl overflow-hidden shadow-2xl border border-gray-100 aspect-[9/16] relative flex items-center justify-center">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.tiktok.com/embed/v2/live/${tiktokUrl.split('tiktok.com/')[1]?.split('?')[0]?.split('/')[0]?.replace('@', '')}`}
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Sección Derecha: Productos */}
              <div className="flex-1 w-full">
                {productosLive.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                    {productosLive.map((producto, index) => (
                      <ProductoCard key={producto.id} producto={producto} index={index} abrirVistaRapida={abrirVistaRapida} agregarAlCarrito={agregarAlCarritoRapido} liveActivo={liveActivo} />
                    ))}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <Video className="w-8 h-8 mb-4 text-gray-300" />
                    <p className="text-sm tracking-widest uppercase mb-2">No hay prendas marcadas</p>
                    <p className="text-xs">Ve a tu administrador y activa &quot;Mostrar que estará en live&quot; en algunas prendas.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Grid de Productos Normales */}
        {productosFiltrados.length > 0 ? (
          <div>
            <h3 className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-6">Catálogo General</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
              {productosFiltrados.map((producto, index) => (
                <ProductoCard key={producto.id} producto={producto} index={index} abrirVistaRapida={abrirVistaRapida} agregarAlCarrito={agregarAlCarritoRapido} liveActivo={liveActivo} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-400 text-sm tracking-widest uppercase">No hay artículos disponibles en esta categoría</p>
          </div>
        )}
      </div>

      {/* Modal Vista Rápida */}
      <AnimatePresence>
        {productoSeleccionado && (
          <ModalVistaRapida 
            producto={productoSeleccionado}
            todosLosProductos={productos}
            cerrar={cerrarVistaRapida} 
            agregar={agregarAlCarritoDesdeModal} 
            mostrarError={mostrarToast}
          />
        )}
      </AnimatePresence>

      {/* Carrito Lateral (Off-canvas) */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 right-0 h-full w-[85vw] max-w-[400px] bg-white z-50 shadow-2xl flex flex-col rounded-l-3xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-lg font-serif text-black flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" /> Mi Bolsa ({carrito.length})
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {carrito.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <ShoppingBag className="w-16 h-16 text-gray-200" strokeWidth={1} />
                    <p className="text-sm text-gray-500 uppercase tracking-widest">Tu bolsa está vacía</p>
                    <button onClick={() => setIsCartOpen(false)} className="text-xs uppercase font-bold text-black border-b border-black pb-1">Continuar comprando</button>
                  </div>
                ) : (
                  carrito.map((item) => (
                    <div key={item.itemUnicoId} className="flex gap-4 bg-[#fcfcfc] p-3 rounded-sm border border-gray-100">
                      <img src={item.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} alt={item.nombre} className="w-20 h-24 object-cover rounded-sm" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-black uppercase tracking-wide line-clamp-1 pr-2">{item.nombre}</h4>
                            <button onClick={() => eliminarDelCarrito(item.itemUnicoId)} className="text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {(item.tallaSeleccionada || item.colorSeleccionado) && (
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                              {item.tallaSeleccionada && `Talla: ${item.tallaSeleccionada}`}
                              {item.colorSeleccionado && ` | Color: ${item.colorSeleccionado}`}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="text-sm font-bold text-black block">Bs. {item.precioVenta?.toFixed(2)}</span>
                          {item.precioOriginal && item.precioOriginal > item.precioVenta && (
                            <span className="text-xs text-gray-400 line-through">Bs. {item.precioOriginal?.toFixed(2)}</span>
                          )}
                          {item.precioOriginal && item.precioOriginal > item.precioVenta && (
                            <span className="text-[9px] bg-red-100 text-red-600 px-1 py-0.5 rounded-sm font-bold uppercase tracking-widest">
                              -{Math.round((1 - item.precioVenta / item.precioOriginal) * 100)}%
                            </span>
                          )}
                          {item.isConjunto && item.precioOriginal && item.precioOriginal > item.precioVenta && (
                            <span className="text-[9px] bg-black text-white px-1 py-0.5 rounded-sm font-bold uppercase tracking-widest">
                              PROMO CONJUNTO
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {carrito.length > 0 && (
                <div className="p-6 border-t border-gray-100 bg-[#fcfcfc]">
                  {ahorroTotal > 0 && (
                    <div className="flex justify-between items-center mb-2 text-gray-400">
                      <span className="text-xs uppercase tracking-widest">Subtotal sin descuento</span>
                      <span className="text-xs line-through">Bs. {totalOriginalCarrito.toFixed(2)}</span>
                    </div>
                  )}
                  {ahorroTotal > 0 && (
                    <div className="flex justify-between items-center mb-4 text-red-600">
                      <span className="text-xs uppercase tracking-widest font-bold">Descuento total aplicado</span>
                      <span className="text-xs font-bold">- Bs. {ahorroTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-6 pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold uppercase tracking-widest text-black">Total a Pagar</span>
                    <span className="text-2xl font-serif text-black">Bs. {totalCarrito.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={async () => {
                      if (carrito.length === 0) return;
                      setIsSubmittingCheckout(true);
                      localStorage.setItem("bruna_carrito", JSON.stringify(carrito));
                      setIsCartOpen(false);
                      router.push(`/checkout`);
                    }}
                    disabled={isSubmittingCheckout}
                    className="w-full bg-black text-white text-xs uppercase tracking-widest font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-xl disabled:bg-gray-400"
                  >
                    {isSubmittingCheckout ? "Reservando..." : "Completar Compra"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function ProductoCard({ producto, index, abrirVistaRapida, agregarAlCarrito, liveActivo }: { producto: any, index: number, abrirVistaRapida: (p:any) => void, agregarAlCarrito: (p:any) => void, liveActivo?: boolean }) {
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"];

  const descuento = producto.precioOriginal && producto.precioOriginal > producto.precioVenta
    ? Math.round((1 - producto.precioVenta / producto.precioOriginal) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative flex flex-col cursor-pointer"
    >
      {/* Etiquetas */}
      <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5">
        {producto.enLive && liveActivo && (
          <span className="bg-red-600 text-white text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded-sm shadow-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
          </span>
        )}
        {descuento && (
          <span className="bg-black text-white text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded-sm shadow-sm">
            -{descuento}%
          </span>
        )}
        {producto.enPreventa && (
          <span className="bg-blue-600 text-white text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded-sm shadow-sm">
            Preventa
          </span>
        )}
        {producto.isConjunto && (
          <span className="bg-gray-800 text-white text-[9px] tracking-widest uppercase font-bold px-2 py-1 rounded-sm shadow-sm">
            Conjunto
          </span>
        )}
      </div>

      {/* Imagen */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 mb-4 rounded-sm" onClick={() => abrirVistaRapida(producto)}>
        <img 
          src={imagenes[0]} 
          alt={`${producto.nombre}`} 
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${producto.stockCount === 0 && !producto.enPreventa ? 'grayscale opacity-60' : ''}`}
        />
        {/* Segunda imagen al hacer hover si existe */}
        {imagenes.length > 1 && (
          <img 
            src={imagenes[1]} 
            alt={`${producto.nombre} alternativa`} 
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          />
        )}
      </div>

      {/* Info y Acción Rápida */}
      <div className="flex flex-col flex-1 px-1">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1" onClick={() => abrirVistaRapida(producto)}>
            <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{producto.nombre}</h3>
            <p className="text-[10px] text-gray-500 mb-2 capitalize">{producto.categoria}</p>
          </div>
          
          {/* Botón directo de agregar */}
          {(producto.stockCount > 0 || producto.enPreventa) ? (
            <button 
              onClick={(e) => { e.stopPropagation(); agregarAlCarrito(producto); }}
              className="bg-black text-white p-2 rounded-full hover:bg-gray-800 hover:scale-110 transition-all shadow-md group-hover:shadow-xl"
              title="Añadir a la bolsa"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          ) : (
             <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest border border-gray-200 px-2 py-1">Agotado</span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-auto" onClick={() => abrirVistaRapida(producto)}>
          <span className="text-sm font-bold text-black">Bs. {producto.precioVenta?.toFixed(2)}</span>
          {producto.precioOriginal && producto.precioOriginal > producto.precioVenta && (
            <span className="text-xs text-gray-400 line-through">Bs. {producto.precioOriginal?.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ModalVistaRapida({ producto, todosLosProductos, cerrar, agregar, mostrarError }: { producto: any, todosLosProductos: any[], cerrar: () => void, agregar: (p:any, t:string, c:string) => void, mostrarError: (msg: string) => void }) {
  const [tallaSeleccionada, setTallaSeleccionada] = useState("");
  const [colorSeleccionado, setColorSeleccionado] = useState("");
  
  const imagenes = producto.imagenes?.length > 0 ? producto.imagenes : ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"];
  const [imagenActual, setImagenActual] = useState(imagenes[0]);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  const tallas = producto.tallas || [];
  const colores = producto.colores || [];

  const handleAgregar = () => {
    if (!producto.isConjunto) {
      if (tallas.length > 0 && !tallaSeleccionada) {
        mostrarError("Falta seleccionar: Por favor elige una talla.");
        return;
      }
      if (colores.length > 0 && !colorSeleccionado) {
        mostrarError("Falta seleccionar: Por favor elige un color.");
        return;
      }
    }
    agregar(producto, tallaSeleccionada, colorSeleccionado);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={cerrar}
        className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 w-full md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-[800px] md:rounded-lg bg-white z-50 flex flex-col md:flex-row overflow-hidden shadow-2xl max-h-[90vh]"
      >
        <button onClick={cerrar} className="absolute top-4 right-4 z-10 bg-white/50 md:bg-gray-100 p-2 rounded-full text-black hover:bg-gray-200">
          <X className="w-5 h-5" />
        </button>

        <div 
          className="w-full md:w-1/2 h-[40vh] md:h-[60vh] bg-gray-100 relative group cursor-pointer"
          onClick={() => setImagenAmpliada(imagenActual)}
        >
          <img src={imagenActual} alt={producto.nombre} className="w-full h-full object-cover transition-opacity group-hover:opacity-90" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Search className="w-10 h-10 text-white drop-shadow-md" />
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          <h2 className="text-2xl font-serif text-black mb-2">{producto.nombre}</h2>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-xl font-bold text-black">Bs. {producto.precioVenta?.toFixed(2)}</span>
            {producto.precioOriginal && producto.precioOriginal > producto.precioVenta && (
              <>
                <span className="text-sm text-gray-400 line-through">Bs. {producto.precioOriginal?.toFixed(2)}</span>
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-sm font-bold uppercase tracking-widest">
                  -{Math.round((1 - producto.precioVenta / producto.precioOriginal) * 100)}%
                </span>
                {producto.isConjunto && (
                  <span className="text-[10px] bg-black text-white px-2 py-1 rounded-sm font-bold uppercase tracking-widest">Conjunto en Promoción</span>
                )}
              </>
            )}
          </div>
          
          <p className="text-sm text-gray-600 mb-6">{producto.descripcionLarga || "Sin descripción detallada."}</p>

          {producto.isConjunto && producto.piezasDetalle && (
            <div className="mb-6 bg-gray-50 p-4 rounded-sm border border-gray-200">
              <span className="text-xs font-bold uppercase tracking-widest text-black block mb-3">Este conjunto incluye:</span>
              <ul className="space-y-2">
                {Object.values(typeof producto.piezasDetalle === 'string' ? JSON.parse(producto.piezasDetalle) : producto.piezasDetalle).map((pieza: any) => {
                  const prodRef = todosLosProductos.find((p:any) => p.id === pieza.id);
                  return (
                    <li key={pieza.id} className="text-sm text-gray-700 flex flex-col mb-3 last:mb-0">
                      <div className="flex items-center gap-3">
                        <div className="relative group cursor-pointer shrink-0" onClick={() => {
                          const img = prodRef?.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80";
                          setImagenAmpliada(img);
                        }}>
                          <img 
                            src={prodRef?.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} 
                            alt={prodRef?.nombre || "Prenda"} 
                            className="w-10 h-12 object-cover rounded-sm border border-black/10 shadow-sm transition-opacity group-hover:opacity-75" 
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                            <Search className="w-4 h-4 text-white drop-shadow-md" />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs bg-black/5 px-1.5 py-0.5 rounded-sm">{pieza.cantidad}x</span> 
                            <span className="uppercase text-xs font-medium leading-tight">{prodRef?.nombre || "Prenda"}</span>
                          </div>
                          {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 font-bold">
                              {pieza.tallaEspecifica && `T: ${pieza.tallaEspecifica} `}
                              {pieza.colorEspecifico && `| C: ${pieza.colorEspecifico}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!producto.isConjunto && tallas.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-black block mb-3">Tallas Disponibles</span>
              <div className="flex gap-2 flex-wrap">
                {tallas.map((t: string) => (
                  <button 
                    key={t}
                    onClick={() => setTallaSeleccionada(t)}
                    className={`px-4 py-2 text-xs border rounded-sm transition-colors ${tallaSeleccionada === t ? "border-black bg-black text-white" : "border-gray-300 text-gray-600 hover:border-black"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!producto.isConjunto && colores.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-black block mb-3">Colores</span>
              <div className="flex gap-2 flex-wrap">
                {colores.map((c: string) => (
                  <button 
                    key={c}
                    onClick={() => setColorSeleccionado(c)}
                    className={`px-4 py-2 text-xs border rounded-sm transition-colors capitalize ${colorSeleccionado === c ? "border-black border-2 font-bold" : "border-gray-300 text-gray-600 hover:border-black"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 border-t border-gray-100">
             {producto.stockCount > 0 || producto.enPreventa ? (
               <button 
                 onClick={handleAgregar}
                 className="w-full bg-black text-white text-xs uppercase tracking-widest font-bold py-4 rounded-sm hover:bg-gray-800 transition-colors"
               >
                 Añadir a la bolsa
               </button>
             ) : (
               <button disabled className="w-full bg-gray-200 text-gray-500 text-xs uppercase tracking-widest font-bold py-4 rounded-sm cursor-not-allowed">
                 Agotado
               </button>
             )}
          </div>
        </div>
      </motion.div>

      {/* Lightbox para vista ampliada */}
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
            <img 
              src={imagenAmpliada} 
              alt="Ampliada" 
              className="max-w-full max-h-full object-contain cursor-zoom-out" 
              onClick={(e) => { e.stopPropagation(); setImagenAmpliada(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
