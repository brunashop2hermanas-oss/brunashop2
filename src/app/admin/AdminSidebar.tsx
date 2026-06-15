"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Video, BarChart3, Store, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Cerrar el menú al cambiar de ruta en móvil
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Inicio", path: "/admin", icon: LayoutDashboard },
    { name: "Registrar Venta (Caja)", path: "/admin/nueva-venta", icon: Store },
    { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingBag },
    { name: "Catálogo y Live TikTok", path: "/admin/productos", icon: Video },
    { name: "Clientas y Puntos", path: "/admin/clientas", icon: Users },
    { name: "Reportes y PDF", path: "/admin/reportes", icon: BarChart3 },
  ];

  return (
    <>
      {/* Cabecera Móvil (Solo visible en pantallas pequeñas) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-surface-border bg-surface/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="BrunaShop2 Logo" 
            className="w-10 h-10 object-cover rounded-full ring-2 ring-brand-primary/30"
          />
          <h2 className="text-lg font-bold text-foreground">
            Panel <span className="text-brand-primary">Admin</span>
          </h2>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 bg-surface-border rounded-xl text-foreground hover:text-brand-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay oscuro para cuando el menú está abierto en móvil */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Menú Lateral (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 md:w-64 border-r border-surface-border bg-surface/95 backdrop-blur-xl p-6 flex flex-col shadow-2xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:bg-surface/50 md:glass
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Botón de cerrar en móvil (dentro del menú) */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="absolute top-4 right-4 p-2 bg-surface-border/50 rounded-full text-foreground hover:text-brand-primary transition-colors md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-10 mt-6 md:mt-0 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full"></div>
            <img 
              src="/logo.png" 
              alt="BrunaShop2 Admin Logo" 
              className="w-24 md:w-36 h-auto object-cover rounded-full shadow-lg ring-2 ring-brand-primary/30 relative z-10" 
              style={{ clipPath: "circle(48%)" }}
            />
          </div>
          <h2 className="text-xl font-bold text-foreground hidden md:block">
            Panel <span className="text-brand-primary">Admin</span>
          </h2>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                  ? 'bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/30 scale-[1.02]' 
                  : 'hover:bg-surface-border/50 text-foreground/80 hover:text-brand-primary'
                }`}
              >
                <Icon className="w-5 h-5" /> {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 pt-6 border-t border-surface-border flex flex-col gap-2">
          <Link href="/admin/configuracion" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            pathname.startsWith('/admin/configuracion') 
            ? 'bg-brand-primary text-white font-bold shadow-lg shadow-brand-primary/30 scale-[1.02]' 
            : 'hover:bg-surface-border/50 text-foreground/80 hover:text-brand-primary'
          }`}>
            <Settings className="w-5 h-5" /> Configuración
          </Link>
          <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </Link>
        </div>
      </aside>
    </>
  );
}
