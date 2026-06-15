"use client";

import { motion } from "framer-motion";
import { ShoppingBag, Star, ArrowRight } from "lucide-react";
import CatalogoProductos from "@/components/CatalogoProductos";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden relative">
      {/* Círculos decorativos de fondo (Efecto Glassmorphism / 3D sutil) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-brand-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/20 rounded-full blur-3xl" />

      <main className="z-10 flex flex-col items-center text-center px-4 max-w-4xl">
        
        {/* Logo y Título animados con efecto 3D */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex flex-col items-center"
        >
          <div className="relative mb-6 hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 bg-brand-primary/20 blur-xl rounded-full"></div>
            <img 
              src="/logo.png" 
              alt="BrunaShop2 Logo" 
              className="w-48 md:w-56 h-auto object-cover rounded-full shadow-2xl ring-4 ring-brand-primary/30 relative z-10" 
              style={{ clipPath: "circle(48%)" }}
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tighter drop-shadow-lg">
            Bruna<span className="text-brand-primary">Shop2</span>
          </h1>
          <p className="mt-4 text-xl md:text-2xl text-foreground/80 font-light">
            Elegancia y estilo en cada prenda.
          </p>
        </motion.div>

        {/* Tarjeta 3D Flotante (Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
          className="glass shadow-3d p-8 md:p-12 rounded-3xl flex flex-col items-center border border-surface-border bg-surface/50 w-full md:w-auto"
          style={{ perspective: 1000 }}
        >
          <div className="bg-brand-primary/10 p-4 rounded-full mb-6">
            <ShoppingBag className="w-12 h-12 text-brand-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4 text-foreground">Catálogo Exclusivo</h2>
          <p className="text-foreground/70 mb-8 max-w-md">
            Descubre nuestras últimas colecciones seleccionadas especialmente para ti. Calidad, diseño y tendencia.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              window.scrollTo({
                top: window.innerHeight * 0.8,
                behavior: 'smooth'
              });
            }}
            className="flex items-center gap-2 bg-brand-primary text-background px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-brand-primary/50 transition-all cursor-pointer"
          >
            Ver Colección
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Pequeño distintivo animado */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-16 flex items-center gap-2 text-brand-accent font-medium bg-brand-accent/10 px-4 py-2 rounded-full"
        >
          <Star className="w-4 h-4 fill-brand-accent" />
          Clientas Frecuentes: ¡Gana puntos con cada compra!
        </motion.div>

      </main>

      {/* Renderizado del Catálogo de Ropa */}
      <CatalogoProductos />
    </div>
  );
}
