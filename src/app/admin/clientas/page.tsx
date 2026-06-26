"use client";

import { motion } from "framer-motion";
import { Star, Gift, Search, Phone, IdCard, FileText, Calendar, Trash } from "lucide-react";
import { useState } from "react";

import { getClientas, resetPuntosClientas } from "@/app/actions/clientas";
import { useEffect } from "react";

const WhatsappIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
  </svg>
);

import { deleteVenta } from "@/app/actions/ventas";
import { getUserRole } from "@/app/actions/auth";
import toast from "react-hot-toast";

export default function AdminClientas() {
  const [busqueda, setBusqueda] = useState("");
  const [clientas, setClientas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientaSeleccionada, setClientaSeleccionada] = useState<any>(null);
  const [criterioOrden, setCriterioOrden] = useState<"defecto" | "puntos">("defecto");
  const [filtroFecha, setFiltroFecha] = useState<'hoy' | 'semana' | 'mes' | 'año' | 'todo' | 'especifica'>('todo');
  const [fechaEspecifica, setFechaEspecifica] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [userRole, setUserRole] = useState('');
  
  // Estados para el Modal de Clienta
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'historial' | 'editar'>('historial');
  const [editData, setEditData] = useState({ nombres: '', apellidos: '', ci: '', celular: '' });
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para modal de confirmación de eliminación
  const [ventaAEliminar, setVentaAEliminar] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [clientaAEliminar, setClientaAEliminar] = useState<string | null>(null);
  const [isDeletingClienta, setIsDeletingClienta] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const role = await getUserRole();
      if (role) setUserRole(role);
      
      const res = await getClientas();
      if (res.success) {
        setClientas(res.data || []);
      }
      setIsLoading(false);
    };
    initData();
  }, []);

  const handleVerClienta = (clienta: any) => {
    setClientaSeleccionada(clienta);
    const [nombres, ...apellidosArr] = clienta.nombre.split(" ");
    setEditData({
      nombres: nombres || '',
      apellidos: apellidosArr.join(" ") || '',
      ci: clienta.ci || '',
      celular: clienta.celular || ''
    });
    setActiveTab('historial');
    setIsClientModalOpen(true);
  };

  const clientasFiltradas = clientas.filter(c => {
    // Search filter
    const matchesSearch = (c.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) || 
      (c.ci || "").toLowerCase().includes(busqueda.toLowerCase()) ||
      (c.celular || "").includes(busqueda);
    if (!matchesSearch) return false;

    // Date filter
    if (!c.fechaRegistroRaw) return true;
    const fechaRegistro = new Date(c.fechaRegistroRaw);
    const hoy = new Date();

    if (filtroFecha === 'todo') return true;
    if (filtroFecha === 'hoy') return fechaRegistro.getDate() === hoy.getDate() && fechaRegistro.getMonth() === hoy.getMonth() && fechaRegistro.getFullYear() === hoy.getFullYear();
    if (filtroFecha === 'semana') return (hoy.getTime() - fechaRegistro.getTime()) <= (7 * 24 * 60 * 60 * 1000);
    if (filtroFecha === 'mes') return fechaRegistro.getMonth() === hoy.getMonth() && fechaRegistro.getFullYear() === hoy.getFullYear();
    if (filtroFecha === 'año') return fechaRegistro.getFullYear() === hoy.getFullYear();
    if (filtroFecha === 'especifica' && fechaEspecifica) {
      const parts = fechaEspecifica.split('-');
      if (parts.length === 3) {
        return fechaRegistro.getFullYear() === parseInt(parts[0]) &&
               fechaRegistro.getMonth() === parseInt(parts[1]) - 1 &&
               fechaRegistro.getDate() === parseInt(parts[2]);
      }
      return true; // Si no hay fecha seleccionada aún, muestra todas.
    }

    return true;
  }).sort((a, b) => {
    if (criterioOrden === "puntos") {
      return b.prendasCompradas - a.prendasCompradas;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      
      {/* VISTA PRINCIPAL (SE OCULTA EN PDF SI HAY CLIENTA SELECCIONADA) */}
      <div className={clientaSeleccionada ? "print-hidden-main" : ""}>
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            Clientas VIP
          </h1>
          <p className="text-foreground/70 mt-1 text-lg mb-4">
            Directorio de clientas frecuentes y acumulación de puntos (1 Prenda = 1 Punto).
          </p>

          <div className="mb-4 p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              <strong>Tip de uso:</strong> Esta lista se llena sola cuando registras clientas en la Caja. Las clientas ganan 1 punto por cada prenda comprada. ¡Si llegan a cierta cantidad, regálales algo bonito!
            </p>
          </div>
        </div>
        <div className="no-print">
          <button 
            onClick={() => setIsResetModalOpen(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
          >
            Resetear Todos los Puntos a 0
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setCriterioOrden("defecto")}
          className={`glass p-6 rounded-3xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${criterioOrden === "defecto" ? 'border-4 border-brand-primary bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 ring-4 ring-brand-primary/50 shadow-[0_0_40px_10px_#D49A9A] scale-[1.02] z-10 relative' : 'border border-surface-border shadow-lg hover:border-brand-primary hover:shadow-xl'}`}
        >
          <div className="bg-brand-primary p-4 rounded-full text-background">
            <Star className="w-8 h-8" />
          </div>
          <div>
            <p className="text-foreground/70 font-medium text-sm uppercase tracking-wider">Total Clientas</p>
            <p className="text-3xl font-black text-foreground">{isLoading ? "..." : clientas.length}</p>
          </div>
        </motion.div>
        
        <motion.div 
          whileTap={{ scale: 0.95 }}
          onClick={() => setCriterioOrden("puntos")}
          className={`glass p-6 rounded-3xl flex items-center gap-4 cursor-pointer transition-all duration-300 ${criterioOrden === "puntos" ? 'border-4 border-yellow-500 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 ring-4 ring-yellow-500/50 shadow-[0_0_40px_10px_#eab308] scale-[1.02] z-10 relative' : 'border border-surface-border shadow-lg hover:border-yellow-500 hover:shadow-xl'}`}
        >
          <div className="bg-yellow-500 p-4 rounded-full text-white">
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <p className="text-foreground/70 font-medium text-sm uppercase tracking-wider">Top Clienta</p>
            <p className="text-2xl font-bold text-foreground truncate">Ranking por Puntos</p>
          </div>
        </motion.div>
      </div>

      {/* Buscador y Tabla */}
      <div className="bg-surface border border-surface-border rounded-3xl shadow-3d overflow-hidden">
        
        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 md:p-6 border-b border-surface-border bg-surface/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch sm:items-center">
            <div className="flex items-center bg-background border border-surface-border px-3 py-2 rounded-xl shadow-inner relative group">
              <Calendar className="w-5 h-5 text-brand-primary mr-2 shrink-0" />
              <select 
                value={filtroFecha}
                onChange={(e) => setFiltroFecha(e.target.value as any)}
                className="bg-transparent border-none outline-none w-full sm:w-44 text-sm font-bold text-foreground cursor-pointer appearance-none pr-8"
              >
                <option value="todo">Todas las fechas</option>
                <option value="hoy">⭐ Registradas HOY</option>
                <option value="semana">📅 De esta Semana</option>
                <option value="mes">📅 De este Mes</option>
                <option value="año">📅 De este Año</option>
                <option value="especifica">📌 Fecha Específica</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>

            {filtroFecha === 'especifica' && (
              <input 
                type="date" 
                value={fechaEspecifica}
                onChange={(e) => setFechaEspecifica(e.target.value)}
                className="bg-background border border-brand-primary/50 px-3 py-2 rounded-xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-brand-primary shadow-inner"
              />
            )}
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, CI o celular..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-background border border-surface-border pl-12 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all"
            />
          </div>
        </div>

        {/* Tabla Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="bg-background/50 border-b border-surface-border text-foreground/70 uppercase text-xs font-bold tracking-wider">
                <th className="p-5">Clienta</th>
                <th className="p-5">Identidad / Envío</th>
                <th className="p-5 text-center">Pedidos Totales</th>
                <th className="p-5 text-right">Gasto Histórico</th>
                <th className="p-5 text-center">Puntos (Prendas)</th>
                <th className="p-5 text-center no-print">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : clientasFiltradas.length > 0 ? (
                clientasFiltradas.map((clienta) => (
                  <tr key={clienta.id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="p-5">
                      <p className="font-bold text-foreground text-lg">{clienta.nombre}</p>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-foreground/80 font-medium">
                          <IdCard className="w-4 h-4 text-brand-primary" />
                          <span className="font-bold">CI:</span> {clienta.ci || "Sin CI"}
                        </div>
                        <a 
                          href={`https://wa.me/${clienta.celular?.startsWith("591") ? clienta.celular : `591${clienta.celular}`}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-foreground/80 font-medium hover:text-brand-primary hover:underline cursor-pointer"
                        >
                          <WhatsappIcon className="w-4 h-4 text-[#25D366]" />
                          {clienta.celular || "Sin Celular"}
                        </a>
                      </div>
                    </td>
                    <td className="p-5 text-center">
                      <span className="font-black text-foreground text-lg">{clienta.totalPedidos}</span>
                    </td>
                    <td className="p-5 text-right">
                      <span className="font-bold text-brand-primary text-lg">Bs. {clienta.dineroGastado.toFixed(2)}</span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="inline-flex items-center justify-center gap-2 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-4 py-2 rounded-xl font-black text-lg">
                        <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                        {clienta.prendasCompradas}
                      </div>
                    </td>
                    <td className="p-5 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleVerClienta(clienta)}
                          className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> Perfil
                        </button>
                        {userRole === 'ADMINISTRADOR' && (
                          <button
                            onClick={() => setClientaAEliminar(clienta.id)}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl font-bold transition-colors flex items-center justify-center"
                            title="Eliminar Clienta"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-foreground/50 font-medium">
                    {clientas.length === 0 ? "Todavía no hay clientas registradas." : "No se encontró ninguna clienta con esos datos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Vista Móvil (Tarjetas) */}
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : clientasFiltradas.length > 0 ? (
            clientasFiltradas.map((clienta) => (
              <div key={clienta.id} className="bg-surface border border-surface-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-surface-border pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight">{clienta.nombre}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
                        <IdCard className="w-4 h-4 text-brand-primary" />
                        <span className="font-bold">CI:</span> {clienta.ci || "Sin CI"}
                      </div>
                      <a 
                        href={`https://wa.me/${clienta.celular?.startsWith("591") ? clienta.celular : `591${clienta.celular}`}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground/80 text-sm font-medium hover:text-brand-primary hover:underline cursor-pointer"
                      >
                        <WhatsappIcon className="w-4 h-4 text-[#25D366]" />
                        {clienta.celular || "Sin Celular"}
                      </a>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs uppercase tracking-widest text-foreground/50 font-bold">Puntos</span>
                    <div className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-2 py-1 rounded-lg font-black text-sm">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {clienta.prendasCompradas}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-background/50 p-3 rounded-lg border border-surface-border">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Pedidos</p>
                    <p className="font-black text-foreground">{clienta.totalPedidos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Gastado</p>
                    <p className="font-bold text-brand-primary">Bs. {clienta.dineroGastado.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1 w-full">
                  <button 
                    onClick={() => handleVerClienta(clienta)}
                    className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 flex-1"
                  >
                    <FileText className="w-4 h-4" /> Ver Perfil
                  </button>
                  {userRole === 'ADMINISTRADOR' && (
                    <button
                      onClick={() => setClientaAEliminar(clienta.id)}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded-xl font-bold transition-colors flex items-center justify-center"
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-foreground/50 font-medium bg-surface rounded-xl">
              {clientas.length === 0 ? "Todavía no hay clientas registradas." : "No se encontró ninguna clienta con esos datos."}
            </div>
          )}
        </div>
        
        <div className="p-4 bg-background/50 border-t border-surface-border text-center text-sm font-medium text-foreground/60 no-print">
          Tip: Úsala durante tus Lives. Si una clienta tiene muchos puntos, ¡mándale un regalito sorpresa en su próximo envío!
        </div>
      </div>
      </div> {/* FIN DE LA VISTA PRINCIPAL */}

      {/* FICHA TÉCNICA DE CLIENTE (OCULTA EN PANTALLA, VISIBLE EN PDF) */}
      {clientaSeleccionada && (
        <div className="hidden print-ficha w-full">
          {/* Cabecera Oficial */}
          <div className="border-b-2 border-black pb-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="BrunaShop2" className="w-16 h-16 object-cover rounded-full filter grayscale" style={{ clipPath: "circle(50%)" }} />
                <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter text-black">BrunaShop2</h1>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Ficha de Clienta Frecuente</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-black">Fecha de Impresión: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
                <p className="text-sm font-bold text-black">ID Sistema: <span className="font-normal">CLI-{clientaSeleccionada.id.toString().padStart(4, '0')}</span></p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border border-black p-6 rounded-xl">
              <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Datos Personales</h2>
              <p className="text-2xl font-black text-black uppercase mb-4">{clientaSeleccionada.nombre}</p>
              <div className="space-y-2">
                <p className="text-black font-bold">Carnet de Identidad: <span className="font-normal">{clientaSeleccionada.ci}</span></p>
                <p className="text-black font-bold">Celular / WhatsApp: <a href={`https://wa.me/${clientaSeleccionada.celular?.startsWith("591") ? clientaSeleccionada.celular : `591${clientaSeleccionada.celular}`}`} target="_blank" rel="noopener noreferrer" className="font-normal text-blue-600 hover:underline">{clientaSeleccionada.celular}</a></p>
              </div>
            </div>
            
            <div className="border border-black p-6 rounded-xl bg-gray-50">
              <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Resumen de Compras</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Pedidos Totales</p>
                  <p className="text-3xl font-black text-black">{clientaSeleccionada.totalPedidos}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Gasto Histórico</p>
                  <p className="text-3xl font-black text-black">Bs. {clientaSeleccionada.dineroGastado.toFixed(2)}</p>
                </div>
                <div className="col-span-2 mt-2 pt-2 border-t border-gray-300">
                  <p className="text-xs font-bold uppercase text-gray-500">Puntos Acumulados (Prendas)</p>
                  <p className="text-4xl font-black text-black flex items-center gap-2">
                    ★ {clientaSeleccionada.prendasCompradas} PUNTOS
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Historial Detallado de Compras */}
          <div className="border border-black p-6 rounded-xl mb-8">
            <h2 className="text-sm font-bold uppercase text-gray-500 border-b border-gray-300 pb-2 mb-4">Historial Detallado de Compras</h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500">Fecha y Hora</th>
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500">Prenda Adquirida</th>
                  <th className="pb-2 text-xs font-bold uppercase text-gray-500 text-right">Monto (Bs.)</th>
                </tr>
              </thead>
              <tbody>
                {clientaSeleccionada.compras && clientaSeleccionada.compras.length > 0 ? (
                  clientaSeleccionada.compras.map((compra: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-sm text-black">
                        <span className="font-bold">{compra.fecha}</span> <br/>
                        <span className="text-xs text-gray-500">{compra.hora}</span>
                      </td>
                      <td className="py-3 text-sm font-bold text-black">{compra.prenda}</td>
                      <td className="py-3 text-sm font-black text-black text-right">{compra.monto.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-sm text-gray-500">No hay compras registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* Firmas Oficiales para PDF */}
          <div className="mt-12 break-inside-avoid">
            <div className="flex justify-around">
              <div className="text-center">
                <div className="w-48 border-b-2 border-black mb-2 mx-auto"></div>
                <p className="font-bold text-sm text-black">Firma Encargada</p>
                <p className="text-xs text-gray-500">BrunaShop2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: letter;
            margin: 2cm;
          }
          body { 
            -webkit-print-color-adjust: exact; 
            background: white !important;
            color: black !important;
          }
          .no-print { display: none !important; }
          aside, nav { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; border: none !important; box-shadow: none !important; }
          
          /* Ocultar la pantalla principal si estamos imprimiendo ficha */
          .print-hidden-main { display: none !important; }
          
          /* Mostrar Ficha */
          .print-ficha { display: block !important; }
        }
      `}} />

      {/* Modal del Directorio (Perfil de Clienta) */}
      {isClientModalOpen && clientaSeleccionada && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-surface-border rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
          >
            {/* Header */}
            <div className="p-6 border-b border-surface-border flex justify-between items-center bg-background/50">
              <div>
                <h2 className="text-2xl font-black text-foreground">{clientaSeleccionada.nombre}</h2>
                <p className="text-foreground/70 font-medium text-sm flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  {clientaSeleccionada.prendasCompradas} Puntos • Bs. {clientaSeleccionada.dineroGastado.toFixed(2)} Gastado
                </p>
              </div>
              <button 
                onClick={() => setIsClientModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-border/50 hover:bg-surface-border transition-colors text-foreground"
              >
                ✕
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-surface-border">
              <button 
                onClick={() => setActiveTab('historial')}
                className={`flex-1 p-4 font-bold text-center transition-colors border-b-2 ${activeTab === 'historial' ? 'border-brand-primary text-brand-primary bg-brand-primary/5' : 'border-transparent text-foreground/70 hover:bg-surface-border/50'}`}
              >
                Historial de Pedidos
              </button>
              <button 
                onClick={() => setActiveTab('editar')}
                className={`flex-1 p-4 font-bold text-center transition-colors border-b-2 ${activeTab === 'editar' ? 'border-brand-primary text-brand-primary bg-brand-primary/5' : 'border-transparent text-foreground/70 hover:bg-surface-border/50'}`}
              >
                Editar Datos
              </button>
            </div>
            
            {/* Contenido */}
            <div className="p-6 overflow-y-auto flex-1 bg-surface">
              {activeTab === 'historial' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-foreground text-lg">Pedidos Registrados</h3>
                    <button 
                      onClick={() => {
                        setTimeout(() => { window.print(); }, 100);
                      }}
                      className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 rounded-xl font-bold transition-colors flex items-center gap-2 text-sm"
                    >
                      <FileText className="w-4 h-4" /> Imprimir Ficha
                    </button>
                  </div>
                  
                  {clientaSeleccionada.compras && clientaSeleccionada.compras.length > 0 ? (
                    <div className="border border-surface-border rounded-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-background/50 border-b border-surface-border">
                          <tr>
                            <th className="p-4 text-xs font-bold uppercase text-foreground/50">Fecha</th>
                            <th className="p-4 text-xs font-bold uppercase text-foreground/50">Detalle</th>
                            <th className="p-4 text-xs font-bold uppercase text-foreground/50">Monto</th>
                            {userRole === 'ADMINISTRADOR' && (
                              <th className="p-4 text-xs font-bold uppercase text-foreground/50 text-right">Acción</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {clientaSeleccionada.compras.map((compra: any, idx: number) => (
                            <tr key={idx} className="hover:bg-brand-primary/5 transition-colors">
                              <td className="p-4">
                                <span className="font-bold text-foreground">{compra.fecha}</span><br/>
                                <span className="text-xs text-foreground/50">{compra.hora}</span>
                              </td>
                              <td className="p-4 font-bold text-foreground">{compra.prenda}</td>
                              <td className="p-4 font-black text-foreground">Bs. {compra.monto.toFixed(2)}</td>
                              {userRole === 'ADMINISTRADOR' && (
                                <td className="p-4 text-right">
                                  <button 
                                    onClick={() => setVentaAEliminar(compra.ventaId)}
                                    className="text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Eliminar
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-10 text-center bg-background/50 rounded-xl border border-surface-border">
                      <p className="text-foreground/50 font-medium">No hay pedidos registrados.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-foreground/70 mb-1">Nombres</label>
                      <input 
                        type="text"
                        value={editData.nombres}
                        onChange={(e) => setEditData({...editData, nombres: e.target.value})}
                        className="w-full bg-background border border-surface-border p-3 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground/70 mb-1">Apellidos</label>
                      <input 
                        type="text"
                        value={editData.apellidos}
                        onChange={(e) => setEditData({...editData, apellidos: e.target.value})}
                        className="w-full bg-background border border-surface-border p-3 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground/70 mb-1">Carnet de Identidad (CI)</label>
                      <input 
                        type="text"
                        value={editData.ci}
                        onChange={(e) => setEditData({...editData, ci: e.target.value})}
                        className="w-full bg-background border border-surface-border p-3 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground/70 mb-1">Celular</label>
                      <input 
                        type="text"
                        value={editData.celular}
                        onChange={(e) => setEditData({...editData, celular: e.target.value})}
                        className="w-full bg-background border border-surface-border p-3 rounded-xl outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-surface-border flex justify-between items-center">
                    {userRole === 'ADMINISTRADOR' ? (
                      <button 
                        onClick={() => setClientaAEliminar(clientaSeleccionada.id)}
                        className="text-red-500 font-bold hover:underline text-sm"
                      >
                        Eliminar Clienta por Completo
                      </button>
                    ) : <div></div>}
                    <button 
                      onClick={async () => {
                        setIsSaving(true);
                        const { updateClienta } = await import('@/app/actions/clientas');
                        const res = await updateClienta(clientaSeleccionada.id, editData);
                        if (res.success) {
                          toast.success("Datos guardados exitosamente");
                          const resClientas = await getClientas();
                          if (resClientas.success) {
                            setClientas(resClientas.data || []);
                            const updatedClienta = resClientas.data?.find(c => c.id === clientaSeleccionada.id);
                            if (updatedClienta) setClientaSeleccionada(updatedClienta);
                          }
                        } else {
                          toast.error(res.error || "Error al guardar");
                        }
                        setIsSaving(false);
                      }}
                      disabled={isSaving}
                      className="bg-brand-primary text-white font-bold px-6 py-3 rounded-xl hover:bg-brand-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {ventaAEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-surface-border p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Star className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-4">¿Eliminar Pedido?</h2>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Esta acción eliminará el registro de la venta, restará los puntos y devolverá el stock al catálogo. 
                <strong className="text-red-500 block mt-2">Esta acción no se puede deshacer.</strong>
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setVentaAEliminar(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-foreground/70 bg-surface border border-surface-border hover:bg-surface-border transition-colors outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    setIsDeleting(true);
                    const res = await deleteVenta(ventaAEliminar);
                    if (res.success) {
                      toast.success("Pedido eliminado exitosamente");
                      const resClientas = await getClientas();
                      if (resClientas.success) {
                        setClientas(resClientas.data || []);
                        const updatedClienta = resClientas.data?.find(c => c.id === clientaSeleccionada.id);
                        if (updatedClienta) setClientaSeleccionada(updatedClienta);
                      }
                    } else {
                      toast.error(res.error || "Error al eliminar pedido");
                    }
                    setIsDeleting(false);
                    setVentaAEliminar(null);
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeleting ? "Borrando..." : "Sí, Eliminar"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Confirmar Eliminación Clienta */}
      {clientaAEliminar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-surface-border p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Star className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-4">¿Eliminar Clienta?</h2>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                Esta acción borrará <strong className="text-foreground">COMPLETAMENTE</strong> el perfil de la clienta.
                A diferencia de los pedidos, esta eliminación no devuelve stock. 
                <strong className="text-red-500 block mt-2">Esta acción es irreversible.</strong>
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setClientaAEliminar(null)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-foreground/70 bg-surface border border-surface-border hover:bg-surface-border transition-colors outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    setIsDeletingClienta(true);
                    const { deleteClienta } = await import('@/app/actions/clientas');
                    const res = await deleteClienta(clientaAEliminar);
                    if (res.success) {
                      toast.success("Clienta eliminada exitosamente");
                      const resClientas = await getClientas();
                      if (resClientas.success) setClientas(resClientas.data || []);
                      setIsClientModalOpen(false);
                    } else {
                      toast.error(res.error || "Error al eliminar clienta");
                    }
                    setIsDeletingClienta(false);
                    setClientaAEliminar(null);
                  }}
                  disabled={isDeletingClienta}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isDeletingClienta ? "Borrando..." : "Sí, Eliminar Clienta"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de Confirmación de Reseteo */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface border border-surface-border p-8 rounded-3xl max-w-md w-full shadow-2xl relative"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                <Star className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-4">¿Resetear Puntos?</h2>
              <p className="text-foreground/70 mb-8 leading-relaxed">
                ¿Estás segura de querer resetear los puntos de <strong className="text-foreground">TODAS</strong> las clientas a 0? 
                Esta acción no se puede deshacer y es ideal para iniciar una nueva temporada de premios.
              </p>
              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-foreground/70 bg-surface border border-surface-border hover:bg-surface-border transition-colors outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    setIsResetModalOpen(false);
                    setIsLoading(true);
                    await resetPuntosClientas();
                    const res = await getClientas();
                    if (res.success) setClientas(res.data || []);
                    setIsLoading(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 outline-none focus:ring-2 focus:ring-red-500"
                >
                  Sí, Resetear
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
