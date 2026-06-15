"use client";

import { LayoutDashboard, ShoppingBag, Users, Settings, LogOut, Video, BarChart3, Store } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Inicio", path: "/admin", icon: LayoutDashboard },
    { name: "Registrar Venta (Caja)", path: "/admin/nueva-venta", icon: Store },
    { name: "Pedidos", path: "/admin/pedidos", icon: ShoppingBag },
    { name: "Catálogo y Live TikTok", path: "/admin/productos", icon: Video },
    { name: "Clientas y Puntos", path: "/admin/clientas", icon: Users },
    { name: "Reportes y PDF", path: "/admin/reportes", icon: BarChart3 },
  ];

  return (
    <aside className="w-full md:w-64 border-r border-surface-border bg-surface/50 p-6 flex flex-col glass z-20">
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-brand-primary/20 blur-lg rounded-full"></div>
          <img 
            src="/logo.png" 
            alt="BrunaShop2 Admin Logo" 
            className="w-28 md:w-36 h-auto object-cover rounded-full shadow-lg ring-2 ring-brand-primary/30 relative z-10" 
            style={{ clipPath: "circle(48%)" }}
          />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          Panel <span className="text-brand-primary">Admin</span>
        </h2>
      </div>
      
      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/admin" ? pathname === "/admin" : pathname.startsWith(item.path);
          
          return (
            <Link 
              key={item.path} 
              href={item.path} 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20' 
                : 'hover:bg-surface-border/50 text-foreground/80'
              }`}
            >
              <Icon className="w-5 h-5" /> {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-surface-border flex flex-col gap-2">
        <Link href="/admin/configuracion" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
          pathname.startsWith('/admin/configuracion') 
          ? 'bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20' 
          : 'hover:bg-surface-border/50 text-foreground/80'
        }`}>
          <Settings className="w-5 h-5" /> Configuración
        </Link>
        <Link href="/login" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
          <LogOut className="w-5 h-5" /> Cerrar Sesión
        </Link>
      </div>
    </aside>
  );
}
