"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Menu, X, ArrowRight, Video } from "lucide-react";
import CatalogoProductos from "@/components/CatalogoProductos";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getPrendas } from "@/app/actions/productos";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveActivoBanner, setLiveActivoBanner] = useState(false);
  const [colecciones, setColecciones] = useState<string[]>([]);
  const [coleccionActiva, setColeccionActiva] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    getPrendas().then((res) => {
      if (res.success && res.data) {
        const cols = Array.from(new Set(res.data.map((p: any) => p.coleccion).filter(Boolean))) as string[];
        setColecciones(cols);
      }
    }).catch(e => console.error(e));
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
      }
    }, 100);
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen">
      {/* Alarma de TikTok Live */}
      {liveActivoBanner && (
        <div className="w-full bg-red-600 text-white py-2 flex items-center justify-center gap-2 text-[10px] md:text-xs font-semibold tracking-widest uppercase cursor-pointer hover:bg-red-700 transition-colors z-50 relative" onClick={() => scrollToSection('catalogo')}>
          <Video className="w-4 h-4 animate-pulse" />
          <span>¡Estamos en vivo en TikTok! Toca aquí para ver las prendas exclusivas</span>
        </div>
      )}

      {/* Header Responsivo */}
      <header className={`w-full fixed top-8 md:top-10 z-40 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-2" : "bg-transparent py-3"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Menu Mobile Icon */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-black p-1">
            <Menu className={`w-6 h-6 ${isScrolled ? "text-black" : "text-white drop-shadow-md"}`} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center rounded-full p-1 transition-all duration-300 ${isScrolled ? "bg-black/5" : "bg-white/10 backdrop-blur-sm"}`}>
              <img 
                src="/logo.png" 
                alt="BrunaShop Logo" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-full shadow-sm"
              />
            </div>
            <h1 className={`hidden sm:block text-2xl font-extrabold tracking-tighter ${isScrolled ? "text-black" : "text-white drop-shadow-md"}`}>
              Bruna<span className={isScrolled ? "text-gray-400" : "text-gray-300"}>Shop</span>
            </h1>
          </div>

          {/* Nav Desktop */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium">
            <button onClick={() => scrollToSection('catalogo')} className={`hover:opacity-70 transition-opacity uppercase tracking-widest ${isScrolled ? "text-black" : "text-white drop-shadow-md"}`}>Colección</button>
            <button onClick={() => scrollToSection('catalogo')} className={`hover:opacity-70 transition-opacity uppercase tracking-widest font-bold ${isScrolled ? "text-red-600" : "text-red-400 drop-shadow-md"}`}>Ofertas</button>
          </nav>

          {/* Acciones */}
          <div className="flex items-center gap-4">
            {/* El icono de carrito está en CatalogoProductos, pero visualmente dejamos este espacio vacío para que el flex-between centre el logo si se requiere, o simplemente balancee */}
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      {/* Menú Móvil */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, x: "-100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed top-0 left-0 h-full w-[85vw] max-w-[320px] bg-white z-50 flex flex-col pt-8 px-6 shadow-2xl rounded-r-3xl"
            >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-extrabold tracking-tighter text-black">Bruna<span className="text-gray-400">Shop</span></h2>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-black bg-gray-50 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex flex-col gap-6 text-lg font-medium tracking-widest uppercase overflow-y-auto">
              <button onClick={() => { setColeccionActiva(null); scrollToSection('catalogo'); }} className="text-left py-4 border-b border-gray-100 flex justify-between items-center text-sm">TODAS LAS COLECCIONES <ArrowRight className="w-5 h-5 text-gray-300"/></button>
              {colecciones.map((col) => (
                <button key={col} onClick={() => { setColeccionActiva(col); scrollToSection('catalogo'); }} className="text-left py-4 border-b border-gray-100 flex justify-between items-center text-sm">{col} <ArrowRight className="w-5 h-5 text-gray-300"/></button>
              ))}
              <button onClick={() => { setColeccionActiva(null); scrollToSection('catalogo'); }} className="text-left py-4 border-b border-gray-100 text-red-600 flex justify-between items-center text-sm">Ofertas / Sale <ArrowRight className="w-5 h-5 text-red-300"/></button>
            </nav>
            <div className="mt-auto mb-8 text-xs text-center text-gray-400 tracking-widest uppercase">
              Descubre lo último en tendencia
            </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section a Pantalla Completa */}
      <main className="relative w-full h-[85vh] md:h-screen flex items-center justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop" 
            alt="Moda Femenina Lifestyle" 
            className="w-full h-full object-cover object-center opacity-80"
          />
          {/* Gradient Overlay sutil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30"></div>
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl flex flex-col items-center mt-20 md:mt-0">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-8xl font-serif text-white mb-6 drop-shadow-lg"
          >
            Nueva Colección
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-base md:text-xl text-white/90 mb-10 max-w-lg font-light drop-shadow-md"
          >
            Diseños exclusivos que definen tu estilo. Descubre lo último en moda femenina, adaptado a ti.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            onClick={() => scrollToSection('catalogo')}
            className="bg-white text-black px-10 py-4 font-medium text-xs tracking-widest uppercase hover:bg-gray-100 transition-colors flex items-center gap-3 shadow-xl"
          >
            Descubrir <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </main>

      {/* Catálogo de Productos */}
      <div id="catalogo">
        <CatalogoProductos liveActivoBanner={liveActivoBanner} setLiveActivoBanner={setLiveActivoBanner} coleccionFiltro={coleccionActiva} setColeccionFiltro={setColeccionActiva} />
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
