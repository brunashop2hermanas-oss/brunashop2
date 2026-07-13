"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Video, BarChart3, Store, Menu, X, ChevronLeft, ChevronRight, Globe, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUser } from "@/app/actions/auth";
import { getCountPedidosNuevos } from "@/app/actions/ventas";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false); // Para escritorio
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState("Cargando...");
  const [userRole, setUserRole] = useState("");
  const [userPerms, setUserPerms] = useState<string[]>([]);
  const [nuevosPedidos, setNuevosPedidos] = useState(0);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const nameMatch = document.cookie.match(/(?:^|; )bruna_user_name=([^;]*)/);
      if (nameMatch) setUserName(decodeURIComponent(nameMatch[1]));
      
      const roleMatch = document.cookie.match(/(?:^|; )bruna_user_role=([^;]*)/);
      if (roleMatch) setUserRole(decodeURIComponent(roleMatch[1]));

      const permsMatch = document.cookie.match(/(?:^|; )bruna_user_permissions=([^;]*)/);
      if (permsMatch) {
        try {
          setUserPerms(JSON.parse(decodeURIComponent(permsMatch[1])));
        } catch(e){}
      }
    }
    setIsOpenMobile(false);
  }, [pathname]);

  // Polling para nuevos pedidos cada 30 segundos
  useEffect(() => {
    const fetchNuevosPedidos = async () => {
      try {
        const res = await getCountPedidosNuevos();
        if (res.success && res.count !== undefined) {
          setNuevosPedidos(res.count);
        }
      } catch (e) {}
    };
    
    fetchNuevosPedidos();
    const intervalo = setInterval(fetchNuevosPedidos, 30000);
    return () => clearInterval(intervalo);
  }, []);

  const navItems = [
    { name: "Inicio", path: "/admin", icon: LayoutDashboard, perm: null },
    { name: "Caja", path: "/admin/nueva-venta", icon: Store, perm: "ACCESO_CAJA" },
    { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingBag, perm: "ACCESO_PEDIDOS" },
    { name: "Catálogo", path: "/admin/productos", icon: Video, perm: "ACCESO_CATALOGO" },
    { name: "Clientas", path: "/admin/clientas", icon: Users, perm: "ACCESO_CLIENTAS" },
    { name: "Reportes", path: "/admin/reportes", icon: BarChart3, perm: "ACCESO_REPORTES" },
  ];

  // Filtrar items según permisos (ADMINISTRADOR ve todo)
  const visibleNavItems = navItems.filter(item => {
    if (userRole === "ADMINISTRADOR" || userRole === "ADMIN" || !item.perm) return true;
    return userPerms.includes(item.perm);
  });

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  return (
    <>
      {/* Cabecera Móvil (Solo visible en pantallas pequeñas) */}
      <div className="md:hidden print:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
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
        fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 flex flex-col shadow-2xl md:shadow-none print:hidden md:sticky md:top-0 md:h-screen shrink-0
        transition-all duration-300 ease-in-out
        ${isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-52'}
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

        {/* Perfil de Usuario */}
        <div className={`px-4 py-4 border-b border-gray-100 flex items-center gap-3 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
            <UserCircle className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Sesión Iniciada</span>
              <span className="text-sm font-bold text-black truncate max-w-[150px]">{userName}</span>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3 flex flex-col gap-1">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path);
            
            return (
              <Link 
                key={item.path} 
                href={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-md transition-all relative
                  ${isActive 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-black'
                  }
                `}
              >
                <Icon className={`w-5 h-5 min-w-[1.25rem] ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} /> 
                <span className={`text-sm font-medium tracking-wide transition-opacity duration-200 whitespace-nowrap flex-1 flex justify-between items-center ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
                  {item.name}
                  {item.name === "Pedidos" && nuevosPedidos > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                      +{nuevosPedidos}
                    </span>
                  )}
                </span>
                
                {/* Notificación en modo colapsado */}
                {isCollapsed && item.name === "Pedidos" && nuevosPedidos > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping md:block hidden"></span>
                )}
                {isCollapsed && item.name === "Pedidos" && nuevosPedidos > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full md:block hidden"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          {(userRole === "ADMINISTRADOR" || userRole === "ADMIN" || userPerms.includes("ACCESO_CONFIGURACION")) && (
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
          )}

          <Link 
            href="/admin/tienda" 
            title={isCollapsed ? "Ver Tienda Pública" : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all font-bold border w-full ${
              pathname === '/admin/tienda' 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'text-blue-600 hover:bg-blue-50 border-blue-100/50'
            }`}
          >
            <Globe className={`w-5 h-5 min-w-[1.25rem] ${pathname === '/admin/tienda' ? 'text-white' : ''}`} /> 
            <span className={`text-sm tracking-wide transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:hidden' : 'opacity-100'}`}>
              Ver Tienda Pública
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
