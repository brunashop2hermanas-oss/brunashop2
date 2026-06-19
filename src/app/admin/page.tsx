"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, ShoppingBag, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import { getDashboardStats } from "@/app/actions/reportes";

export default function DashboardInicio() {
  const [stats, setStats] = useState({
    ingresosHoy: 0,
    ingresosMes: 0,
    ingresosAno: 0,
    pedidosHoy: 0,
    masVendido: "Cargando...",
    clientasTotales: 0,
    alertasInventario: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await getDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <h1 className="text-3xl font-extrabold text-foreground mb-2">Bienvenida, Dueña</h1>
      <p className="text-foreground/70 mb-8">Aquí tienes el resumen de cómo va BrunaShop2 hoy.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex items-center gap-4">
          <div className="p-4 bg-green-500/20 text-green-500 rounded-2xl"><DollarSign className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Ingresos</p>
            <p className="text-2xl font-black text-foreground">Bs. {stats.ingresosHoy} <span className="text-xs font-normal text-foreground/50">Hoy</span></p>
            <div className="flex gap-4 mt-2">
              <p className="text-sm font-bold text-foreground/80">Bs. {stats.ingresosMes} <span className="text-[10px] font-normal text-foreground/50">Mes</span></p>
              <p className="text-sm font-bold text-foreground/80">Bs. {stats.ingresosAno} <span className="text-[10px] font-normal text-foreground/50">Año</span></p>
            </div>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex items-center gap-4">
          <div className="p-4 bg-brand-primary/20 text-brand-primary rounded-2xl"><ShoppingBag className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Nuevos Pedidos</p>
            <p className="text-3xl font-black text-foreground">{stats.pedidosHoy}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex items-center gap-4">
          <div className="p-4 bg-yellow-500/20 text-yellow-500 rounded-2xl"><TrendingUp className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Más Vendido</p>
            <p className="text-lg font-black text-foreground leading-tight">{stats.masVendido}</p>
          </div>
        </div>
        <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d flex items-center gap-4">
          <div className="p-4 bg-purple-500/20 text-purple-500 rounded-2xl"><Users className="w-8 h-8" /></div>
          <div>
            <p className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Clientas Registradas</p>
            <p className="text-3xl font-black text-foreground">{stats.clientasTotales}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-10 rounded-3xl border border-surface-border shadow-3d text-center flex flex-col justify-center items-center">
          <h2 className="text-xl font-bold mb-4">¡Todo en orden!</h2>
          <p className="text-foreground/70">Navega por el menú de la izquierda para gestionar pedidos o actualizar el catálogo.</p>
        </div>

        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 border-b border-surface-border pb-4">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span> Alertas de Inventario
          </h2>
          {stats.alertasInventario.length > 0 ? (
            <ul className="space-y-4">
              {stats.alertasInventario.map((alerta: any, idx: number) => (
                <li key={idx} className="flex justify-between items-center bg-background/50 p-4 rounded-xl border border-red-500/20">
                  <div>
                    <p className="font-bold">{alerta.nombre}</p>
                    {alerta.tallasBajas.length > 0 ? (
                      <p className="text-xs text-red-500 font-bold mt-1">Tallas bajas: {alerta.tallasBajas.join(", ")}</p>
                    ) : (
                      <p className="text-xs text-red-500 font-bold mt-1">Stock general bajo</p>
                    )}
                  </div>
                  <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-xl font-black text-lg">
                    {alerta.stock}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-foreground/60 text-center py-8">Excelente. No tienes prendas con stock crítico.</p>
          )}
        </div>
      </div>
    </div>
  );
}
