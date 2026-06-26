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
      <header className={`w-full fixed top-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-sm py-1.5" : "bg-transparent py-2"}`}>
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
            <div className="relative group">
              <button className={`hover:opacity-70 transition-opacity uppercase tracking-widest flex items-center gap-1 ${isScrolled ? "text-black" : "text-[#4e342e]"}`}>
                Colecciones <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden group-hover:flex flex-col bg-white shadow-2xl py-3 rounded-xl min-w-[220px] border border-gray-100">
                <button onClick={() => { setColeccionActiva(null); scrollToSection('catalogo'); }} className="text-left px-5 py-2.5 hover:bg-gray-50 text-black text-sm uppercase tracking-widest font-bold border-b border-gray-100">
                  Todas las Colecciones
                </button>
                {colecciones.map((col) => (
                  <button key={col} onClick={() => { setColeccionActiva(col); scrollToSection('catalogo'); }} className="text-left px-5 py-2 hover:bg-gray-50 text-gray-700 text-sm uppercase tracking-wider">
                    {col}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => scrollToSection('catalogo')} className={`hover:opacity-70 transition-opacity uppercase tracking-widest font-bold ${isScrolled ? "text-red-600" : "text-red-500 drop-shadow-sm"}`}>Ofertas</button>
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
      <main className="relative w-full h-[85vh] md:h-screen flex items-center justify-center overflow-hidden bg-[#FDFBF7]">
        {/* Imagen de fondo (logo como marca de agua gigante) */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center opacity-[0.07] pointer-events-none">
          <img 
            src="/logo.png" 
            alt="BrunaShop Watermark" 
            className="w-[150%] md:w-[90%] h-auto object-contain mix-blend-multiply"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl flex flex-col items-center mt-20 md:mt-0">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-7xl md:text-[9rem] font-serif text-[#4e342e] mb-0 leading-none drop-shadow-sm uppercase tracking-tighter"
          >
            BRUNAS
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-3xl text-[#6d4c41] mb-12 font-light tracking-[0.4em] uppercase"
          >
            Bolivia
          </motion.p>
          
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.8, delay: 0.4 }}
             className="flex flex-col items-center mb-12 relative"
          >
            <div className="absolute -inset-4 bg-white/40 blur-xl rounded-full z-0"></div>
            <div className="relative z-10">
              <p className="text-xl md:text-4xl font-serif italic text-[#3e2723] mb-2">
                Más que un outfit,
              </p>
              <p className="text-3xl md:text-5xl font-serif text-[#4e342e] font-bold uppercase tracking-widest mb-4">
                Una Conexión Única.
              </p>
              <p className="text-lg md:text-2xl font-serif italic text-[#5d4037]">
                Bruna te viste de historia y luz.
              </p>
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            onClick={() => scrollToSection('catalogo')}
            className="bg-[#4e342e] text-white px-10 py-4 font-medium text-xs tracking-widest uppercase hover:bg-[#3e2723] transition-colors flex items-center gap-3 shadow-2xl rounded-sm"
          >
            Descubrir Colecciones <ArrowRight className="w-4 h-4" />
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
