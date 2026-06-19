"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Video, BarChart3, Store, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/app/actions/auth";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Para escritorio
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Cerrar el menú al cambiar de ruta en móvil
  useEffect(() => {
    setIsOpenMobile(false);
  }, [pathname]);

  const navItems = [
    { name: "Inicio", path: "/admin", icon: LayoutDashboard },
    { name: "Caja", path: "/admin/nueva-venta", icon: Store },
    { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingBag },
    { name: "Catálogo", path: "/admin/productos", icon: Video },
    { name: "Clientas", path: "/admin/clientas", icon: Users },
    { name: "Reportes", path: "/admin/reportes", icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  return (
    <>
      {/* Cabecera Móvil (Solo visible en pantallas pequeñas) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BrunaShop" className="w-8 h-8 object-cover rounded-full" />
          <h2 className="text-lg font-bold text-black tracking-tight">BrunaShop</h2>
        </div>
        <button onClick={() => setIsOpenMobile(true)} className="p-2 text-gray-600 hover:text-black">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Overlay oscuro móvil */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpenMobile(false)}
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Menú Lateral (Sidebar) */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-none
        transition-all duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        
        {/* Header del Sidebar */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 min-w-[2rem] object-cover rounded-md shadow-sm" />
            <h2 className={`font-bold text-black tracking-tight transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden md:block' : 'opacity-100'}`}>
              BrunaShop
            </h2>
          </div>
          
          {/* Botón cerrar en móvil */}
          <button onClick={() => setIsOpenMobile(false)} className="p-1 text-gray-400 hover:text-black md:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-all
                  ${isActive 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-black'
                  }
                `}
              >
                <Icon className={`w-5 h-5 min-w-[1.25rem] ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} /> 
                <span className={`text-sm font-medium tracking-wide transition-opacity duration-200 whitespace-nowrap ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <Link 
            href="/admin/configuracion" 
            title={isCollapsed ? "Configuración" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all ${
              pathname.startsWith('/admin/configuracion') ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 hover:text-black'
            }`}
          >
            <Settings className="w-5 h-5 min-w-[1.25rem]" /> 
            <span className={`text-sm font-medium tracking-wide transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
              Configuración
            </span>
          </Link>

          <button 
            onClick={() => setShowLogoutModal(true)}
            title={isCollapsed ? "Cerrar Sesión" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-red-500 hover:bg-red-50 transition-all w-full text-left"
          >
            <LogOut className="w-5 h-5 min-w-[1.25rem]" /> 
            <span className={`text-sm font-medium tracking-wide transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
              Cerrar Sesión
            </span>
          </button>
        </div>

        {/* Toggle Collapse Button (Desktop Only) */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3.5 top-20 bg-white border border-gray-200 text-gray-500 hover:text-black p-1.5 rounded-full shadow-sm z-50 hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

      </aside>

      {/* Modal de Confirmación de Cierre de Sesión */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full relative z-[101]"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-center text-black mb-4">¿Seguro que deseas cerrar sesión?</h3>
              <p className="text-sm text-gray-500 text-center mb-8">Tendrás que volver a ingresar tus credenciales para acceder al panel.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleLogout} 
                  className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-500/30"
                >
                  Sí, cerrar sesión
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  No, cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
