"use client";

import toast from "react-hot-toast";

import { motion } from "framer-motion";
import { Settings, QrCode, Building, ShieldCheck, Upload, Save, Eye, EyeOff, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { getConfiguracion, updateConfiguracion } from "@/app/actions/config";
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/app/actions/usuarios";
import { uploadImage } from "@/app/actions/upload";
import { compressImage } from "@/lib/imageCompression";
import { Clock, MapPin, CheckSquare, Square } from "lucide-react";
import LimpiezaDB from "./LimpiezaDB";
import LicenciaPlanes from "./LicenciaPlanes";

const BOLIVIA_DATA: Record<string, string[]> = {
  "Beni": ["Cercado (Trinidad)", "Vaca Díez", "Iténez", "José Ballivián", "Mamoré", "Marbán", "Moxos", "Yacuma"],
  "Chuquisaca": ["Oropeza (Sucre)", "Azurduy", "Zudáñez", "Tomina", "Hernando Siles", "Yamparáez", "Nor Cinti", "Sud Cinti", "Belisario Boeto", "Luis Calvo"],
  "Cochabamba": ["Cercado (Cochabamba)", "Campero", "Ayopaya", "Esteban Arce", "Arani", "Arque", "Capinota", "Germán Jordán", "Quillacollo", "Chapare", "Tapacarí", "Carrasco", "Mizque", "Punata", "Bolívar", "Tiraque"],
  "La Paz": ["Murillo (La Paz / El Alto)", "Omasuyos", "Pacajes", "Camacho", "Muñecas", "Larecaja", "Franz Tamayo", "Ingavi", "Loayza", "Inquisivi", "Sur Yungas", "Los Andes", "Aroma", "Nor Yungas", "Iturralde", "Bautista Saavedra", "Manco Kapac", "Gualberto Villarroel", "José Manuel Pando", "Caranavi"],
  "Oruro": ["Cercado (Oruro)", "Abaroa", "Carangas", "Sajama", "Litoral", "Poopó", "Pantaleón Dalence", "Ladislao Cabrera", "Atahuallpa", "Saucari", "Tomás Barrón", "Sur Carangas", "San Pedro de Totora", "Sebastián Pagador", "Mejillones", "Nor Carangas"],
  "Pando": ["Nicolás Suárez (Cobija)", "Manuripi", "Madre de Dios", "Abuná", "Federico Román"],
  "Potosí": ["Tomás Frías (Potosí)", "Rafael Bustillo", "Cornelio Saavedra", "Chayanta", "Charcas", "Nor Chichas", "Alonso de Ibáñez", "Sur Chichas", "Nor Lípez", "Sur Lípez", "José María Linares", "Antonio Quijarro", "General Bernardino Bilbao", "Daniel Campos", "Modesto Omiste", "Enrique Baldivieso"],
  "Santa Cruz": ["Andrés Ibáñez (Santa Cruz de la Sierra)", "Warnes", "Velasco", "Ichilo", "Chiquitos", "Sara", "Cordillera", "Vallegrande", "Florida", "Obispo Santistevan", "Ñuflo de Chávez", "Ángel Sandoval", "Manuel María Caballero", "Germán Busch", "Guarayos"],
  "Tarija": ["Cercado (Tarija)", "Aniceto Arce", "Gran Chaco", "Avilés", "Méndez", "Burnet O'Connor"]
};

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    bancoNombre: "",
    bancoCuenta: "",
    bancoTitular: "",
    qrImagen: null as string | null,
    instagramUrl: "",
    tiktokUrl: "",
    whatsappUrl: "",
    usarControlFinanciero: true,
    liveActivo: false,
    tiempoReservaMinutos: 4,
    tiempoLlenadoDatosMinutos: 10,
    destinosHabilitados: {} as Record<string, string[]>
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  
  const [usuarios, setUsuarios] = useState<{ id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState("");

  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [mostrarModalVerUsuario, setMostrarModalVerUsuario] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState<{ id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string } | null>(null);

  // Form states
  const [formUsr, setFormUsr] = useState({
    nombres: "", apellidos: "", ci: "", telefono: "", username: "", pin: "", role: "CAJERA"
  });
  const [verPin, setVerPin] = useState(false);
  const [savingUsr, setSavingUsr] = useState(false);
  const [errorUsr, setErrorUsr] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const resConfig = await getConfiguracion();
      if (resConfig.success && resConfig.data) {
        setConfig({
          bancoNombre: resConfig.data.bancoNombre || "",
          bancoCuenta: resConfig.data.bancoCuenta || "",
          bancoTitular: resConfig.data.bancoTitular || "",
          qrImagen: resConfig.data.qrImagen,
          instagramUrl: resConfig.data.instagramUrl || "",
          tiktokUrl: resConfig.data.tiktokUrl || "",
          whatsappUrl: resConfig.data.whatsappUrl || "",
          usarControlFinanciero: resConfig.data.usarControlFinanciero ?? true,
          liveActivo: resConfig.data.liveActivo ?? false,
          tiempoReservaMinutos: resConfig.data.tiempoReservaMinutos ?? 4,
          tiempoLlenadoDatosMinutos: resConfig.data.tiempoLlenadoDatosMinutos ?? 10,
          destinosHabilitados: (resConfig.data.destinosHabilitados as Record<string, string[]>) || {}
        });
      }

      const resUsr = await getUsuarios();
      if (resUsr.success && resUsr.data) {
        setUsuarios(resUsr.data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);


  const handleSubirQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQrFile(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      setConfig(prev => ({ ...prev, qrImagen: url }));
    }
  };

  const handleGuardarConfiguracion = async () => {
    setSavingConfig(true);
    setMensajeConfig("");
    try {
      let finalUrl = config.qrImagen;
      
      // Si qrFile existe, significa que seleccionó una nueva foto
      if (qrFile) {
        const compressedFile = await compressImage(qrFile);
        const formData = new FormData();
        formData.append("file", compressedFile);
        const upRes = await uploadImage(formData);
        
        if (upRes.success && upRes.url) {
          finalUrl = upRes.url; // URL real de Supabase
        } else {
          // Si falla la subida, detenemos todo y mostramos error real
          setMensajeConfig("Error subiendo el QR a Supabase: " + (upRes.error || "Desconocido"));
          setSavingConfig(false);
          return; // Abortar guardado
        }
      } else if (finalUrl?.startsWith('blob:')) {
        // Por precaución, si por alguna razón intenta guardar un blob sin archivo
        setMensajeConfig("Error: La imagen es inválida.");
        setSavingConfig(false);
        return;
      }

      const dataToSend = {
        bancoNombre: config.bancoNombre,
        bancoCuenta: config.bancoCuenta,
        bancoTitular: config.bancoTitular,
        qrImagen: finalUrl,
        instagramUrl: config.instagramUrl,
        tiktokUrl: config.tiktokUrl,
        whatsappUrl: config.whatsappUrl,
        usarControlFinanciero: config.usarControlFinanciero,
        liveActivo: config.liveActivo,
        tiempoReservaMinutos: config.tiempoReservaMinutos,
        tiempoLlenadoDatosMinutos: config.tiempoLlenadoDatosMinutos,
        destinosHabilitados: config.destinosHabilitados
      };

      const res = await updateConfiguracion(dataToSend);

      if (res.success) {
        setMensajeConfig("¡Configuración guardada con éxito!");
        setTimeout(() => setMensajeConfig(""), 3000);
      } else {
        setMensajeConfig("Error al guardar: " + res.error);
      }
    } catch (error) {
      setMensajeConfig("Error de conexión");
      console.error(error);
    }
    setSavingConfig(false);
  };

  const handleGuardarUsuario = async () => {
    if (!formUsr.nombres || !formUsr.ci || !formUsr.username || !formUsr.pin) {
      setErrorUsr("Por favor, llena los campos obligatorios.");
      return;
    }
    setSavingUsr(true);
    setErrorUsr("");

    if (usuarioActivo) {
      // Editar
      const res = await updateUsuario(usuarioActivo.id, {
        nombres: formUsr.nombres,
        apellidos: formUsr.apellidos,
        ci: formUsr.ci,
        telefono: formUsr.telefono,
        role: formUsr.role,
        pin: formUsr.pin
      });
      if (res.success) {
        setMostrarModalVerUsuario(false);
        const resUsr = await getUsuarios();
        if (resUsr.success && resUsr.data) {
          setUsuarios(resUsr.data);
        }
      } else {
        setErrorUsr(res.error || "Error al actualizar");
      }
    } else {
      // Crear
      const res = await createUsuario(formUsr);
      if (res.success) {
        setMostrarModalUsuario(false);
        const resUsr = await getUsuarios();
        if (resUsr.success && resUsr.data) {
          setUsuarios(resUsr.data);
        }
      } else {
        setErrorUsr(res.error || "Error al crear");
      }
    }
    setSavingUsr(false);
  };

  const handleBorrarUsuario = async (id: string, nombre: string) => {
    if (confirm(`¿Estás segura de que quieres borrar al usuario ${nombre}?`)) {
      const res = await deleteUsuario(id);
      if (res.success) {
        const resUsr = await getUsuarios();
        if (resUsr.success && resUsr.data) {
          setUsuarios(resUsr.data);
        }
      } else {
        toast.error("¡Uy! Tuvimos un problemita intentando borrar este dato. Por favor, intenta de nuevo.");
      }
    }
  };

  const abrirModalNuevo = () => {
    setFormUsr({ nombres: "", apellidos: "", ci: "", telefono: "", username: "", pin: "", role: "CAJERA" });
    setUsuarioActivo(null);
    setErrorUsr("");
    setMostrarModalUsuario(true);
  };

  const abrirModalVer = (u: { id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string }) => {
    setUsuarioActivo(u);
    setFormUsr({
      nombres: u.nombres, apellidos: u.apellidos, ci: u.ci, telefono: u.telefono,
      username: u.username, pin: u.pin, role: u.role
    });
    setErrorUsr("");
    setMostrarModalVerUsuario(true);
  };

  const toggleDepartamento = (depto: string) => {
    setConfig(prev => {
      const newDestinos = { ...prev.destinosHabilitados };
      if (newDestinos[depto]) {
        delete newDestinos[depto]; // Deshabilitar si ya existe
      } else {
        newDestinos[depto] = []; // Habilitar sin provincias por defecto
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });
  };

  const toggleProvincia = (depto: string, prov: string) => {
    setConfig(prev => {
      const newDestinos = { ...prev.destinosHabilitados };
      if (!newDestinos[depto]) return prev; // El departamento debe estar activo
      
      const idx = newDestinos[depto].indexOf(prov);
      if (idx > -1) {
        newDestinos[depto] = newDestinos[depto].filter(p => p !== prov);
      } else {
        newDestinos[depto] = [...newDestinos[depto], prov];
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Settings className="w-8 h-8 text-brand-primary" /> Configuración de la Tienda
          </h1>
          <p className="text-foreground/70 mt-1">
            Actualiza tu QR de pago, cuentas bancarias y datos de contacto.
          </p>
        </div>
        <div className="flex flex-col items-end">
          <button 
            onClick={handleGuardarConfiguracion}
            disabled={savingConfig}
            className="bg-brand-primary text-background px-6 py-3 rounded-xl font-bold shadow-lg hover:brightness-90 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> {savingConfig ? "Guardando..." : "Guardar Cambios"}
          </button>
          {mensajeConfig && <span className="text-sm font-bold text-green-500 mt-2">{mensajeConfig}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Configuración Bancaria */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
            <Building className="w-6 h-6 text-brand-primary" /> Datos Bancarios
          </h2>
          
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Nombre del Banco</label>
            <input 
              type="text" 
              value={config.bancoNombre} 
              onChange={e => setConfig({...config, bancoNombre: e.target.value})}
              className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Número de Cuenta</label>
            <input 
              type="text" 
              value={config.bancoCuenta} 
              onChange={e => setConfig({...config, bancoCuenta: e.target.value})}
              className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium font-mono" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Titular de la Cuenta</label>
            <input 
              type="text" 
              value={config.bancoTitular} 
              onChange={e => setConfig({...config, bancoTitular: e.target.value})}
              className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium" 
            />
          </div>
          
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground/80">
              Estos datos se mostrarán a la clienta en la pantalla de pago (Checkout).
            </p>
          </div>
        </div>

        {/* Control Financiero Simplificado y Live */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
            <BarChart3 className="w-6 h-6 text-brand-primary" /> Configuraciones Globales
          </h2>
          
          <div className="flex items-center justify-between bg-surface border border-surface-border p-4 rounded-xl">
            <div>
              <p className="font-bold text-foreground">Control Financiero (Costo Proveedor)</p>
              <p className="text-sm text-foreground/70">Actívalo si quieres registrar cuánto te cuestan las prendas para ver tus ganancias netas reales.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                checked={config.usarControlFinanciero} 
                onChange={e => setConfig({...config, usarControlFinanciero: e.target.checked})} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <div>
              <p className="font-bold text-red-600">Botón Maestro: TikTok LIVE</p>
              <p className="text-sm text-red-500/80">Al activarlo, todas las prendas que marcaste como &quot;En Live&quot; aparecerán en la tienda virtual en una pestaña especial para tus clientes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                checked={config.liveActivo || false} 
                onChange={e => setConfig({...config, liveActivo: e.target.checked})} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </div>

        {/* Envíos y Reservas */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
            <MapPin className="w-6 h-6 text-brand-primary" /> Envíos y Reservas
          </h2>

          <div className="bg-surface border border-surface-border p-6 rounded-2xl mb-6">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-brand-primary" /> Tiempo de Reserva (Checkout)
            </h3>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-bold text-foreground mb-1">Tiempo Límite para Pago con QR</p>
                <p className="text-xs text-foreground/70 mb-3">
                  Minutos que tiene la clienta para escanear y subir el comprobante antes de que la reserva expire y las prendas vuelvan al catálogo.
                </p>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" 
                    min="1" max="60"
                    value={config.tiempoReservaMinutos} 
                    onChange={e => setConfig({...config, tiempoReservaMinutos: parseInt(e.target.value) || 4})}
                    className="w-24 bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold text-center" 
                  />
                  <span className="font-medium text-foreground/80">minutos</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-foreground mb-4">Destinos Habilitados para Envío</h3>
            <p className="text-sm text-foreground/70 mb-6">
              Selecciona qué departamentos y provincias quieres mostrar a tus clientas a la hora de comprar.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.keys(BOLIVIA_DATA).map(depto => {
                const isActive = config.destinosHabilitados[depto] !== undefined;
                return (
                  <div key={depto} className={`border rounded-2xl overflow-hidden transition-colors ${isActive ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-surface-border bg-surface/50'}`}>
                    <div 
                      className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors ${isActive ? 'border-b border-brand-primary/20' : ''}`}
                      onClick={() => toggleDepartamento(depto)}
                    >
                      {isActive ? <CheckSquare className="text-brand-primary w-5 h-5" /> : <Square className="text-foreground/40 w-5 h-5" />}
                      <span className={`font-bold ${isActive ? 'text-brand-primary' : 'text-foreground/70'}`}>{depto}</span>
                    </div>
                    
                    {isActive && (
                      <div className="p-4 max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                        <p className="text-xs font-bold text-foreground/50 mb-3 uppercase tracking-wider">Provincias Disponibles:</p>
                        {BOLIVIA_DATA[depto].map(prov => {
                          const isProvActive = config.destinosHabilitados[depto]?.includes(prov);
                          return (
                            <div 
                              key={prov} 
                              className="flex items-center gap-2 cursor-pointer hover:bg-background/50 p-1.5 rounded-lg"
                              onClick={() => toggleProvincia(depto, prov)}
                            >
                              {isProvActive ? <CheckSquare className="text-brand-primary w-4 h-4 shrink-0" /> : <Square className="text-foreground/30 w-4 h-4 shrink-0" />}
                              <span className={`text-sm ${isProvActive ? 'text-foreground font-medium' : 'text-foreground/60'}`}>{prov}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Redes Sociales */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
            Redes Sociales (Pie de Página)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Instagram URL</label>
              <input 
                type="text" 
                placeholder="https://instagram.com/..."
                value={config.instagramUrl} 
                onChange={e => setConfig({...config, instagramUrl: e.target.value})}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">TikTok URL</label>
              <input 
                type="text" 
                placeholder="https://tiktok.com/@..."
                value={config.tiktokUrl} 
                onChange={e => setConfig({...config, tiktokUrl: e.target.value})}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">WhatsApp Link</label>
              <input 
                type="text" 
                placeholder="https://wa.me/591..."
                value={config.whatsappUrl} 
                onChange={e => setConfig({...config, whatsappUrl: e.target.value})}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium" 
              />
            </div>
          </div>
        </div>

        {/* Configuración de QR */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
            <QrCode className="w-6 h-6 text-brand-primary" /> Código QR
          </h2>

          <div className="flex flex-col items-center gap-6">
            <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-md">
              {config.qrImagen ? (
                <img src={config.qrImagen} alt="QR Actual" className="w-48 h-48 object-contain" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-gray-400">Sin QR</div>
              )}
            </div>

            <label className="bg-surface border border-surface-border hover:border-brand-primary hover:text-brand-primary cursor-pointer px-6 py-3 rounded-xl font-bold transition-colors w-full text-center relative overflow-hidden flex justify-center items-center gap-2">
              <Upload className="w-5 h-5" /> Subir Nuevo QR
              <input type="file" accept="image/*" onChange={handleSubirQR} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <p className="text-xs text-foreground/50 text-center px-4">
              Asegúrate de que el QR sea legible. Cuando subas uno nuevo, reemplazará al anterior automáticamente en el checkout.
            </p>
          </div>
        </div>

        {/* Gestión de Personal / Administradores */}
        <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2 mt-4">
          <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-brand-primary" /> Personal y Administradores
            </h2>
            <button 
              onClick={abrirModalNuevo}
              className="bg-surface border border-surface-border text-foreground hover:bg-brand-primary/10 hover:text-brand-primary hover:border-brand-primary transition-colors px-4 py-2 rounded-xl font-bold text-sm"
            >
              + Añadir Usuario
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-background/50 border-b border-surface-border text-foreground/70 uppercase text-xs font-bold tracking-wider">
                  <th className="p-4 rounded-tl-xl">Usuario (Login)</th>
                  <th className="p-4">Nombre Real</th>
                  <th className="p-4 text-center">Rol</th>
                  <th className="p-4 text-right rounded-tr-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="p-4 text-center text-foreground/60">No hay usuarios registrados.</td></tr>
                ) : usuarios.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-primary/5 transition-colors">
                    <td className="p-4 font-bold">{u.username}</td>
                    <td className="p-4 text-foreground/80 font-medium">{u.nombres} {u.apellidos}</td>
                    <td className="p-4 text-center">
                      <span className={u.role === "ADMIN" 
                        ? "bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full text-xs font-bold border border-brand-primary/20"
                        : "bg-surface-border text-foreground/70 px-3 py-1 rounded-full text-xs font-bold border border-surface-border"}>
                        {u.role === "ADMIN" ? "Administrador" : "Cajera"}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-3 items-center">
                      <button onClick={() => abrirModalVer(u)} className="text-sm font-bold text-foreground/50 hover:text-brand-primary">Ver / Editar</button>
                      <button onClick={() => handleBorrarUsuario(u.id, u.nombres)} className="text-sm font-bold text-red-500/70 hover:text-red-500">Borrar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-foreground/50 text-center">
            Los nombres reales configurados aquí son los que aparecerán en la columna &quot;Responsable (Cajero)&quot; de tus reportes financieros.
          </p>
        </div>

        {/* Sección de Licencia y Planes */}
        <div className="lg:col-span-2 mt-4">
          <LicenciaPlanes />
        </div>

        {/* Sección de Limpieza de BD */}
        <div className="lg:col-span-2 mt-4">
          <LimpiezaDB />
        </div>

      </div>

      {/* Modal Añadir / Editar Usuario */}
      {(mostrarModalUsuario || mostrarModalVerUsuario) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-background w-full max-w-md rounded-3xl p-8 border border-surface-border shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              {usuarioActivo ? "Editar Usuario" : "Registrar Nuevo Usuario"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Nombres *</label>
                <input type="text" value={formUsr.nombres} onChange={e=>setFormUsr({...formUsr, nombres: e.target.value})} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>

              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-foreground mb-1">Apellidos</label>
                  <input type="text" value={formUsr.apellidos} onChange={e=>setFormUsr({...formUsr, apellidos: e.target.value})} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-bold text-foreground mb-1">C.I. *</label>
                  <input type="text" value={formUsr.ci} onChange={e=>setFormUsr({...formUsr, ci: e.target.value})} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Teléfono</label>
                <input type="text" value={formUsr.telefono} onChange={e=>setFormUsr({...formUsr, telefono: e.target.value})} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
              </div>
              
              <div className="border-t border-surface-border my-4 pt-4"></div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Usuario de Acceso (Login) *</label>
                <input type="text" value={formUsr.username} onChange={e=>setFormUsr({...formUsr, username: e.target.value})} disabled={!!usuarioActivo} className={`w-full p-3 rounded-xl outline-none font-bold ${usuarioActivo ? 'bg-surface/50 border border-surface-border text-foreground/60 cursor-not-allowed' : 'bg-surface border border-surface-border focus:ring-2 focus:ring-brand-primary'}`} />
              </div>

              <div className="relative">
                <label className="block text-sm font-bold text-brand-primary mb-1">PIN / Contraseña de Acceso *</label>
                <input type={verPin ? "text" : "password"} value={formUsr.pin} onChange={e=>setFormUsr({...formUsr, pin: e.target.value})} className="w-full bg-brand-primary/5 border border-brand-primary/30 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold tracking-widest text-brand-primary pr-12" />
                <button type="button" onClick={() => setVerPin(!verPin)} className="absolute right-3 top-9 text-brand-primary/60 hover:text-brand-primary">
                  {verPin ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Rol</label>
                <select value={formUsr.role} onChange={e=>setFormUsr({...formUsr, role: e.target.value})} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold">
                  <option value="CAJERA">Cajera / Vendedora</option>
                  <option value="ADMIN">Administradora</option>
                </select>
              </div>
            </div>

            {errorUsr && <p className="text-red-500 font-bold text-sm mt-4 text-center">{errorUsr}</p>}

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => { setMostrarModalUsuario(false); setMostrarModalVerUsuario(false); }}
                className="flex-1 bg-surface border border-surface-border text-foreground py-3 rounded-xl font-bold hover:bg-surface-border transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleGuardarUsuario}
                disabled={savingUsr}
                className="flex-1 bg-brand-primary text-white py-3 rounded-xl font-bold hover:brightness-110 transition-colors disabled:opacity-50"
              >
                {savingUsr ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
