"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getPrendas } from "@/app/actions/productos";

export default function CatalogoProductos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<string[]>(["Todas"]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [carrito, setCarrito] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");

  useEffect(() => {
    const fetchProductos = async () => {
      const res = await getPrendas();
      if (res.success) {
        setProductos(res.data || []);
        
        // Extraer categorías únicas
        const cats = Array.from(new Set((res.data || []).map((p: any) => p.categoria).filter(Boolean))) as string[];
        setCategorias(["Todas", ...cats]);
      }
      setIsLoading(false);
    };
    fetchProductos();

    // Actualización automática cada 5 segundos (Tiempo real para los Lives)
    const intervalo = setInterval(() => {
      fetchProductos();
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  // Separar productos
  const productosLive = productos.filter(p => p.enLive);
  const productosFiltrados = productos.filter(p => !p.enLive && (filtroCategoria === "Todas" || p.categoria === filtroCategoria));

  const agregarAlCarrito = (producto: any) => {
    // Calcular cuántos de este producto ya están en el carrito
    const cantidadEnCarrito = carrito.filter(id => id === producto.id).length;

    if (cantidadEnCarrito >= producto.stockCount) {
      // Mostrar advertencia si se excede el stock
      setToast(`¡Agotado! Solo quedan ${producto.stockCount} en stock de "${producto.nombre}".`);
    } else {
      setCarrito([...carrito, producto.id]);
      setToast(`¡"${producto.nombre}" añadido al carrito!`);
    }
    
    // Ocultar notificación después de 3 segundos
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="w-full py-16 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <section className="w-full py-16 px-4 max-w-6xl mx-auto z-10 relative">
      
      {/* Sistema de Notificaciones Flotante (Toast) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full font-semibold shadow-2xl shadow-green-500/50 flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2">Colección Actual</h2>
          <p className="text-foreground/70 text-lg">Explora y enamórate de nuestras prendas</p>
        </div>
        
        {/* Indicador de Carrito Flotante Simulado y Botón de Pago */}
        <div className="flex items-center gap-4">
          <div className="relative cursor-pointer group flex items-center justify-center">
            <div className="bg-brand-primary p-3 rounded-full text-background shadow-lg group-hover:scale-110 transition-transform">
              <ShoppingCart className="w-6 h-6" />
            </div>
            {carrito.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-background animate-bounce">
                {carrito.length}
              </span>
            )}
          </div>
          
          {/* Botón para ir a pagar */}
          {carrito.length > 0 && (
            <Link href="/checkout">
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-green-500 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-green-600 transition-colors flex items-center gap-2 animate-pulse"
              >
                Comprar Ahora ({carrito.length})
              </motion.button>
            </Link>
          )}
        </div>
      </div>

      {/* SECCIÓN: EN LIVE */}
      {productosLive.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
            <h3 className="text-2xl font-bold text-foreground">🔴 Mostrando Ahora en Live</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productosLive.map((producto, index) => (
              <ProductoCard key={producto.id} producto={producto} index={index} agregarAlCarrito={agregarAlCarrito} />
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN: CATÁLOGO POR CATEGORÍAS */}
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-6">Explora Nuestro Catálogo</h3>
        
        {/* Filtros de Categoría */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categorias.map(cat => (
            <button 
              key={cat}
              onClick={() => setFiltroCategoria(cat)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all ${
                filtroCategoria === cat 
                  ? "bg-foreground text-background shadow-md scale-105" 
                  : "bg-surface border border-surface-border text-foreground hover:border-brand-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de Productos Filtrados */}
        {productosFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {productosFiltrados.map((producto, index) => (
              <ProductoCard key={producto.id} producto={producto} index={index} agregarAlCarrito={agregarAlCarrito} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-surface rounded-3xl border border-surface-border">
            <p className="text-foreground/50 text-lg font-medium">No hay productos en esta categoría por ahora.</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Componente Reutilizable para la Tarjeta de Producto
function ProductoCard({ producto, index, agregarAlCarrito }: { producto: any, index: number, agregarAlCarrito: (p:any) => void }) {
  const [imagenActual, setImagenActual] = useState(0);
  
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImagenActual((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImagenActual((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10 }}
      className="group glass rounded-3xl overflow-hidden border border-surface-border shadow-3d relative flex flex-col"
    >
      {/* Etiqueta de "Mostrando en Live" */}
      {producto.enLive && (
        <div className="absolute top-4 left-4 z-20 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
          <span className="w-2 h-2 bg-white rounded-full"></span> EN LIVE
        </div>
      )}
      
      {/* Etiqueta de Preventa */}
      {producto.enPreventa && (
        <div className="absolute top-4 right-4 z-20 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
          PREVENTA
        </div>
      )}

      {/* Imagen del Producto con Carrusel */}
      <div className="relative h-72 w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img 
            key={imagenActual}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            src={imagenes[imagenActual]} 
            alt={`${producto.nombre} - vista ${imagenActual + 1}`} 
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${producto.stockCount === 0 && !producto.enPreventa ? 'grayscale opacity-70' : ''}`}
          />
        </AnimatePresence>
        
        {/* Controles del Carrusel (Solo si hay más de 1 imagen) */}
        {imagenes.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <button onClick={prevImage} className="bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm">
                &#10094;
              </button>
              <button onClick={nextImage} className="bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors backdrop-blur-sm">
                &#10095;
              </button>
            </div>
            {/* Indicadores (Puntitos) */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-10">
              {imagenes.map((_: any, i: number) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === imagenActual ? 'bg-white w-3' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}
        
        {/* Overlay oscuro al hacer hover (debajo de los controles) */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>

      {/* Detalles del Producto */}
      <div className="p-5 flex flex-col flex-1 bg-surface relative z-20">
        <h3 className="font-bold text-lg text-foreground line-clamp-1">{producto.nombre}</h3>
        <p className="text-sm text-brand-primary font-medium mt-1 mb-4">{producto.categoria}</p>
        
        <div className="mt-auto flex justify-between items-center">
          <span className="text-xl font-extrabold text-foreground">Bs. {producto.precioVenta?.toFixed(2)}</span>
          <div className="flex gap-2">
            {producto.stockCount > 0 || producto.enPreventa ? (
              <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => agregarAlCarrito(producto)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary text-background shadow-md hover:bg-brand-accent transition-colors font-semibold text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Añadir
              </motion.button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-border text-foreground/50 cursor-not-allowed font-semibold text-sm">
                Agotado
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
