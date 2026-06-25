"use client";

import toast from "react-hot-toast";
import Link from "next/link";

import { Settings, QrCode, Building, ShieldCheck, Upload, Save, Eye, EyeOff, BarChart3, X } from "lucide-react";
import { useState, useEffect } from "react";
import { getConfiguracion, updateConfiguracion } from "@/app/actions/config";
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario } from "@/app/actions/usuarios";
import { uploadImage } from "@/app/actions/upload";
import { compressImage } from "@/lib/imageCompression";
import { Clock, MapPin, CheckSquare, Square, Trash2, Pencil, RefreshCw } from "lucide-react";
import LimpiezaDB from "./LimpiezaDB";
import LicenciaPlanes from "./LicenciaPlanes";
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

const DEPARTAMENTOS = [
  "Beni", "Chuquisaca", "Cochabamba", "La Paz", "Oruro",
  "Pando", "Potosí", "Santa Cruz", "Tarija"
];



const TERMINOS_POR_DEFECTO = `<p>Al utilizar el sistema de BrunaShop2 y completar una compra, declaras estar de acuerdo con las siguientes condiciones:</p>
<ol>
  <li>Todo pedido realizado a través de la web requiere la carga del comprobante de pago dentro del tiempo de reserva estipulado.</li>
  <li>Si no se sube el comprobante a tiempo, el sistema liberará automáticamente el stock reservado.</li>
  <li>El usuario acepta los términos de envíos y políticas de reembolso vigentes al momento de la compra.</li>
</ol>`;

const ENVIO_POR_DEFECTO = `<ol>
  <li>Los envíos se realizan únicamente a los departamentos y provincias habilitados en el sistema.</li>
  <li>El costo del envío será asumido por el cliente al momento de recoger el paquete, a menos que se indique lo contrario en alguna promoción.</li>
  <li>BrunaShop2 enviará el paquete una vez que se haya validado el pago en nuestro sistema.</li>
</ol>`;

const DEVOLUCIONES_POR_DEFECTO = `<p>En cumplimiento con la normativa de defensa de los derechos del consumidor del Estado Plurinacional de Bolivia (Ley N° 453), BrunaShop2 establece las siguientes políticas:</p>
<ol>
  <li>No se aceptan devoluciones de dinero una vez confirmada la compra y enviado el producto.</li>
  <li>Únicamente se aceptarán cambios físicos del producto si este presenta defectos evidentes de fábrica demostrables al momento de recibirlo.</li>
  <li>Para cualquier solicitud de cambio, el cliente deberá comunicarse dentro de las primeras 24 horas tras la recepción del producto, conservando empaques y etiquetas originales.</li>
</ol>`;

const IDENTIDAD_POR_DEFECTO = `<p><strong>BrunaShop2</strong><br/>
Razón Social: BrunaShop<br/>
Ubicación: La Paz, Estado Plurinacional de Bolivia.<br/>
Atención al Cliente: (Añadir número/contacto aquí)<br/>
Actividad Comercial: Venta minorista de artículos por internet.</p>`;

const JURISDICCION_POR_DEFECTO = `<p>Para todos los efectos legales, las partes se someten a la jurisdicción de las leyes del Estado Plurinacional de Bolivia. Cualquier disputa o controversia que surja de las operaciones realizadas en esta tienda virtual será resuelta ante las autoridades administrativas y los tribunales competentes de la ciudad de La Paz, Bolivia.</p>`;

const POLITICA_POR_DEFECTO = `<p>En BrunaShop2 valoramos tu privacidad y nos comprometemos a proteger tus datos personales, conforme a los principios establecidos en la Constitución Política del Estado Plurinacional de Bolivia (Art. 21.2) y la Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación) referente al comercio electrónico.</p>
<p><strong>1. DATOS QUE RECOPILAMOS</strong><br/>
Para procesar tus pedidos, recopilamos la siguiente información:</p>
<ul>
  <li>Nombres y Apellidos.</li>
  <li>Cédula de Identidad (C.I.).</li>
  <li>Número de teléfono / celular (WhatsApp).</li>
  <li>Información de envío (Departamento y Provincia).</li>
  <li>Imágenes de comprobantes de transferencia bancaria o depósitos (cuando aplique).</li>
  <li>Dirección IP y marca de tiempo (fecha y hora exacta) al momento de aceptar los términos, con fines de seguridad y validación legal (Firma Electrónica/Clickwrap).</li>
</ul>
<p><strong>2. FINALIDAD DEL TRATAMIENTO DE DATOS</strong><br/>
Los datos proporcionados serán utilizados única y exclusivamente para:</p>
<ul>
  <li>Procesar, confirmar y enviar tu pedido.</li>
  <li>Contactarte mediante WhatsApp para actualizar el estado de tu compra.</li>
  <li>Verificar la autenticidad de los pagos realizados mediante revisión manual de los comprobantes subidos.</li>
  <li>Fines de contabilidad interna, registro de clientas y resguardo legal ante posibles desconocimientos de compra.</li>
</ul>
<p><strong>3. USO DE IMÁGENES Y COMPROBANTES</strong><br/>
Al subir una imagen de un comprobante de pago, aceptas que la misma será procesada y almacenada de manera segura, con el único fin de extraer la información necesaria (monto, nombre, número de referencia) para validar tu pago con agilidad. Las imágenes se eliminarán periódicamente de nuestros servidores una vez que el pedido haya concluido exitosamente y expirado el plazo de reclamo.</p>
<p><strong>4. USO DE COOKIES</strong><br/>
Nuestro sistema utiliza "Cookies Esenciales" y almacenamiento local (Local Storage) exclusivamente para funciones operativas básicas, como mantener los productos guardados en tu carrito de compras mientras navegas por la tienda y recordar tu sesión si ya eres clienta recurrente. No utilizamos cookies de rastreo invasivas de terceros ni vendemos tu historial de navegación. Al utilizar nuestra tienda, aceptas el uso de estas cookies estrictamente necesarias para el funcionamiento del sistema.</p>
<p><strong>5. SEGURIDAD Y CONFIDENCIALIDAD</strong><br/>
BrunaShop no venderá, alquilará ni compartirá tus datos personales con terceros externos a nuestra logística, salvo obligación legal o requerimiento de autoridad competente en Bolivia.</p>
<p><strong>6. TUS DERECHOS</strong><br/>
Como usuario, tienes derecho a solicitar la modificación o eliminación de tus datos personales de nuestra base de datos. Para ejercer este derecho, puedes contactarnos directamente mediante nuestro canal de atención al cliente.</p>
<p>Al continuar usando nuestros servicios y finalizar una compra, otorgas tu consentimiento explícito para el tratamiento de tus datos conforme a esta política.</p>`;

export default function AdminConfiguracion() {
  const [config, setConfig] = useState({
    bancoNombre: "",
    bancoCuenta: "",
    bancoTitular: "",
    qrImagen: null as string | null,
    instagramUrl: "",
    facebookUrl: "",
    tiktokUrl: "",
    whatsappUrl: "",
    footerDescripcion: "",
    terminosCondiciones: "",
    politicasEnvio: "",
    politicaPrivacidad: "",
    politicaDevoluciones: "",
    identidadTienda: "",
    jurisdiccion: "",
    usarControlFinanciero: true,
    liveActivo: false,
    liveHorariosRecurrentes: { horarios: [] as { diaSemana: number, hora: string, unSoloUso?: boolean }[], ultimaActivacion: undefined as string | undefined },
    tiempoReservaMinutos: 4,
    tiempoLlenadoDatosMinutos: 10,
    destinosHabilitados: {} as Record<string, { provincias: string[], municipios: string[] }>,
    categoriasPrendas: [] as string[]
  });
  const [qrFile, setQrFile] = useState<File | null>(null);

  const [usuarios, setUsuarios] = useState<{ id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [mensajeConfig, setMensajeConfig] = useState("");

  const [mostrarModalUsuario, setMostrarModalUsuario] = useState(false);
  const [mostrarModalVerUsuario, setMostrarModalVerUsuario] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState<{ id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string } | null>(null);

  // Modal para Destinos
  const [modalDestino, setModalDestino] = useState<{ isOpen: boolean, tipo: 'Provincia' | 'Municipio', depto: string }>({ isOpen: false, tipo: 'Provincia', depto: '' });
  const [isConfirmGuardarOpen, setIsConfirmGuardarOpen] = useState(false);
  const [isRecurrent, setIsRecurrent] = useState(true);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ diaSemana: number, hora: string, unSoloUso: boolean } | null>(null);
  const [expandedLegalSection, setExpandedLegalSection] = useState(false);
  const [expandedVistaPrevia, setExpandedVistaPrevia] = useState(false);
  const [deleteScheduleIndex, setDeleteScheduleIndex] = useState<number | null>(null);
  const [inputDestino, setInputDestino] = useState("");
  // Form states
  const [formUsr, setFormUsr] = useState<{ nombres: string, apellidos: string, ci: string, telefono: string, username: string, pin: string, role: string, permisos: string[] }>({
    nombres: "", apellidos: "", ci: "", telefono: "", username: "", pin: "", role: "EMPLEADO", permisos: []
  });
  const [verPin, setVerPin] = useState(false);
  const [savingUsr, setSavingUsr] = useState(false);
  const [errorUsr, setErrorUsr] = useState("");
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<{ id: string, nombre: string } | null>(null);

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
          facebookUrl: resConfig.data.facebookUrl || "",
          tiktokUrl: resConfig.data.tiktokUrl || "",
          whatsappUrl: resConfig.data.whatsappUrl || "",
          footerDescripcion: resConfig.data.footerDescripcion || "",
          terminosCondiciones: resConfig.data.terminosCondiciones || TERMINOS_POR_DEFECTO,
          politicasEnvio: resConfig.data.politicasEnvio || ENVIO_POR_DEFECTO,
          politicaPrivacidad: resConfig.data.politicaPrivacidad || POLITICA_POR_DEFECTO,
          identidadTienda: resConfig.data.identidadTienda || IDENTIDAD_POR_DEFECTO,
          politicaDevoluciones: resConfig.data.politicaDevoluciones || DEVOLUCIONES_POR_DEFECTO,
          jurisdiccion: resConfig.data.jurisdiccion || JURISDICCION_POR_DEFECTO,
          usarControlFinanciero: resConfig.data.usarControlFinanciero ?? true,
          liveActivo: resConfig.data.liveActivo ?? false,
          liveHorariosRecurrentes: (resConfig.data.liveHorariosRecurrentes as { horarios: { diaSemana: number, hora: string, unSoloUso?: boolean }[], ultimaActivacion: string | undefined }) || { horarios: [] },
          tiempoReservaMinutos: resConfig.data.tiempoReservaMinutos ?? 4,
          tiempoLlenadoDatosMinutos: resConfig.data.tiempoLlenadoDatosMinutos ?? 10,
          destinosHabilitados: {}, // Lo llenamos abajo
          categoriasPrendas: resConfig.data.categoriasPrendas || ["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"]
        });

        const loadedDestinos = (resConfig.data.destinosHabilitados as Record<string, unknown>) || {};
        const parsedDestinos: Record<string, { provincias: string[], municipios: string[] }> = {};
        for (const depto in loadedDestinos) {
          if (Array.isArray(loadedDestinos[depto])) {
            parsedDestinos[depto] = { provincias: loadedDestinos[depto] as string[], municipios: [] };
          } else {
            parsedDestinos[depto] = loadedDestinos[depto] as { provincias: string[], municipios: string[] };
          }
        }
        setConfig(prev => ({ ...prev, destinosHabilitados: parsedDestinos }));
      }

      const resUsr = await getUsuarios();
      if (resUsr.success && resUsr.data) {
        setUsuarios(resUsr.data);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Auto-activate liveActivo visually
  useEffect(() => {
    const interval = setInterval(() => {
      setConfig((prevConfig) => {
        if (prevConfig.liveActivo || !prevConfig.liveHorariosRecurrentes?.horarios?.length) return prevConfig;

        const now = new Date();
        const nowBolivia = new Date(now.getTime() - (4 * 60 * 60 * 1000));
        const hoyDia = nowBolivia.getUTCDay();
        const horaStr = nowBolivia.getUTCHours().toString().padStart(2, '0') + ':' + nowBolivia.getUTCMinutes().toString().padStart(2, '0');
        const hoyStr = nowBolivia.toISOString().split('T')[0];

        let toActivate = false;
        let isOneTime = false;
        let horarioToRemove: { diaSemana: number, hora: string, unSoloUso?: boolean } | null = null;

        for (const h of prevConfig.liveHorariosRecurrentes.horarios) {
          if (h.diaSemana === hoyDia && horaStr >= h.hora) {
            // Activa si es un solo uso, o si es frecuente y no se ha activado hoy
            if (h.unSoloUso || prevConfig.liveHorariosRecurrentes.ultimaActivacion !== hoyStr) {
              toActivate = true;
              if (h.unSoloUso) {
                isOneTime = true;
                horarioToRemove = h;
              }
              break;
            }
          }
        }

        if (toActivate) {
          let newHorarios = prevConfig.liveHorariosRecurrentes.horarios;
          if (isOneTime && horarioToRemove) {
            newHorarios = newHorarios.filter((x: { diaSemana: number, hora: string, unSoloUso?: boolean }) => x !== horarioToRemove);
          }
          return {
            ...prevConfig,
            liveActivo: true,
            liveHorariosRecurrentes: {
              ...prevConfig.liveHorariosRecurrentes,
              horarios: newHorarios,
              ultimaActivacion: isOneTime ? prevConfig.liveHorariosRecurrentes.ultimaActivacion : hoyStr
            }
          };
        }
        return prevConfig;
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);


  const handleSubirQR = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQrFile(e.target.files[0]);
      const url = URL.createObjectURL(e.target.files[0]);
      setConfig(prev => ({ ...prev, qrImagen: url }));
    }
  };

  const handleSaveConfig = async () => {
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
        facebookUrl: config.facebookUrl,
        tiktokUrl: config.tiktokUrl,
        whatsappUrl: config.whatsappUrl,
        footerDescripcion: config.footerDescripcion,
        terminosCondiciones: config.terminosCondiciones,
        politicasEnvio: config.politicasEnvio,
        politicaPrivacidad: config.politicaPrivacidad,
        usarControlFinanciero: config.usarControlFinanciero,
        liveActivo: config.liveActivo,
        liveHorariosRecurrentes: config.liveHorariosRecurrentes,
        tiempoReservaMinutos: config.tiempoReservaMinutos,
        tiempoLlenadoDatosMinutos: config.tiempoLlenadoDatosMinutos,
        destinosHabilitados: config.destinosHabilitados,
        categoriasPrendas: config.categoriasPrendas
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
      const res = await updateUsuario(usuarioActivo.id, {
        nombres: formUsr.nombres,
        apellidos: formUsr.apellidos,
        ci: formUsr.ci,
        telefono: formUsr.telefono,
        role: formUsr.role,
        pin: formUsr.pin,
        permisos: formUsr.permisos
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

  const handleBorrarUsuario = async () => {
    if (!usuarioAEliminar) return;
    setSavingUsr(true);
    const res = await deleteUsuario(usuarioAEliminar.id);
    if (res.success) {
      setUsuarioAEliminar(null);
      const resUsr = await getUsuarios();
      if (resUsr.success && resUsr.data) {
        setUsuarios(resUsr.data);
      }
      toast.success(`Usuario ${usuarioAEliminar.nombre} eliminado correctamente`);
    } else {
      toast.error("¡Uy! Tuvimos un problemita intentando borrar este dato. Por favor, intenta de nuevo.");
    }
    setSavingUsr(false);
  };

  const confirmarBorrarUsuario = (id: string, nombre: string) => {
    setUsuarioAEliminar({ id, nombre });
  };

  const abrirModalNuevo = () => {
    setFormUsr({ nombres: "", apellidos: "", ci: "", telefono: "", username: "", pin: "", role: "EMPLEADO", permisos: [] });
    setUsuarioActivo(null);
    setErrorUsr("");
    setMostrarModalUsuario(true);
  };

  const abrirModalVer = (u: { id: string; nombres: string; apellidos: string; ci: string; telefono: string; username: string; pin: string; role: string; permisos?: string[] }) => {
    setUsuarioActivo(u);
    setFormUsr({
      nombres: u.nombres,
      apellidos: u.apellidos,
      ci: u.ci,
      telefono: u.telefono,
      username: u.username,
      pin: u.pin,
      role: u.role,
      permisos: u.permisos || []
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
        newDestinos[depto] = { provincias: [], municipios: [] }; // Habilitar vacío
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });
  };

  const addProvincia = (depto: string) => {
    setModalDestino({ isOpen: true, tipo: 'Provincia', depto });
    setInputDestino("");
  };

  const removeProvincia = (depto: string, prov: string) => {
    setConfig(prev => {
      const newDestinos = { ...prev.destinosHabilitados };
      if (newDestinos[depto]) {
        newDestinos[depto].provincias = newDestinos[depto].provincias.filter((p: string) => p !== prov);
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });
  };


  const addMunicipio = (depto: string) => {
    setModalDestino({ isOpen: true, tipo: 'Municipio', depto });
    setInputDestino("");
  };

  const handleGuardarDestino = () => {
    if (!inputDestino.trim()) return;

    setConfig(prev => {
      const newDestinos = { ...prev.destinosHabilitados };
      const { depto, tipo } = modalDestino;

      if (tipo === 'Provincia') {
        if (newDestinos[depto] && !newDestinos[depto].provincias.includes(inputDestino.trim())) {
          newDestinos[depto].provincias = [...newDestinos[depto].provincias, inputDestino.trim()];
        }
      } else {
        if (newDestinos[depto] && !newDestinos[depto].municipios.includes(inputDestino.trim())) {
          newDestinos[depto].municipios = [...newDestinos[depto].municipios, inputDestino.trim()];
        }
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });

    setModalDestino({ isOpen: false, tipo: 'Provincia', depto: '' });
    setInputDestino("");
  };

  const removeMunicipio = (depto: string, mun: string) => {
    setConfig(prev => {
      const newDestinos = { ...prev.destinosHabilitados };
      if (newDestinos[depto]) {
        newDestinos[depto].municipios = newDestinos[depto].municipios.filter((m: string) => m !== mun);
      }
      return { ...prev, destinosHabilitados: newDestinos };
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div></div>;

  return (
    <>
      <div className="space-y-8 animate-in fade-in duration-500 pb-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
              <Settings className="w-8 h-8 text-brand-primary" /> Configuración de la Tienda
            </h1>
            <p className="text-foreground/70 mt-1 mb-4">
              Actualiza tu QR de pago, cuentas bancarias y datos de contacto.
            </p>
            <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <span className="text-xl shrink-0">💡</span>
              <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                <strong>Tip de uso:</strong> Esta es la sala de máquinas. Los cambios que hagas aquí se reflejarán de inmediato en la tienda pública (el QR que ven tus clientas, políticas y redes sociales). ¡No olvides darle a &quot;Guardar Cambios&quot; en el botón flotante de abajo a la derecha!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* =========================================
            PRIORIDAD 1: HERRAMIENTAS DE VENTAS Y FINANZAS (BOTÓN LIVE)
            ========================================= */}
          {/* Control Financiero Simplificado y Live */}
          <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
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
                  onChange={e => setConfig({ ...config, usarControlFinanciero: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            <div className="flex flex-col gap-4 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-red-600">Botón Maestro: TikTok LIVE</p>
                  <p className="text-sm text-red-500/80">Al activarlo, todas las prendas que marcaste como &quot;En Live&quot; aparecerán en la tienda virtual en una pestaña especial para tus clientes.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                  <input
                    type="checkbox"
                    checked={config.liveActivo || false}
                    onChange={e => setConfig({ ...config, liveActivo: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>

              <div className="pt-4 border-t border-red-500/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                  <label className="block text-sm font-bold text-red-600">Programar inicio de LIVE</label>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
                    <div className="flex flex-wrap sm:flex-nowrap gap-2">
                      <select
                        id="newLiveDay"
                        className="bg-white border border-red-500/20 text-foreground p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm font-medium shadow-sm w-40"
                      >
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                        <option value="6">Sábado</option>
                        <option value="0">Domingo</option>
                      </select>
                      <input
                        type="time"
                        id="newLiveTime"
                        className="bg-white border border-red-500/20 text-foreground p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm w-32 font-medium shadow-sm"
                      />
                    </div>

                    <div className="flex flex-1 sm:flex-none bg-white rounded-lg p-1 shadow-sm border border-red-500/20">
                      <button
                        onClick={() => setIsRecurrent(true)}
                        className={`px-3 py-2 text-xs font-bold rounded-md transition-all w-full sm:w-auto ${isRecurrent ? 'bg-red-500 text-white shadow-sm' : 'text-red-700 hover:bg-red-50'}`}
                      >
                        Frecuente
                      </button>
                      <button
                        onClick={() => setIsRecurrent(false)}
                        className={`px-3 py-2 text-xs font-bold rounded-md transition-all w-full sm:w-auto ${!isRecurrent ? 'bg-red-500 text-white shadow-sm' : 'text-red-700 hover:bg-red-50'}`}
                      >
                        1 Solo Uso
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const dayInput = document.getElementById("newLiveDay") as HTMLSelectElement;
                        const timeInput = document.getElementById("newLiveTime") as HTMLInputElement;
                        if (!timeInput.value) return;

                        const newSchedule = {
                          diaSemana: parseInt(dayInput.value),
                          hora: timeInput.value,
                          unSoloUso: !isRecurrent
                        };

                        const newHorarios = [...(config.liveHorariosRecurrentes.horarios || [])];
                        newHorarios.push(newSchedule);

                        setConfig({
                          ...config,
                          liveHorariosRecurrentes: {
                            ...config.liveHorariosRecurrentes,
                            horarios: newHorarios
                          }
                        });
                        timeInput.value = "";
                      }}
                      className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-700 transition-all text-sm shadow-md active:scale-95 w-full sm:w-auto"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Lista de horarios guardados */}
                  {config.liveHorariosRecurrentes?.horarios?.length > 0 && (
                    <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-red-500/10">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Tus programaciones activas:
                      </label>
                      {config.liveHorariosRecurrentes.horarios.map((h: { diaSemana: number, hora: string, unSoloUso?: boolean }, i: number) => {
                        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                        return (
                          <div key={i} className="flex flex-col items-start">
                            <div className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-3 border px-4 py-2.5 rounded-2xl text-sm font-bold transition-all w-full sm:w-auto ${editIndex === i ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm' : h.unSoloUso ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                              <span className="flex flex-wrap items-center gap-2 leading-tight">
                                {h.unSoloUso ? (
                                  <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-black">1 Solo Uso</span>
                                ) : (
                                  <span className="bg-red-200 text-red-900 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-black flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Frecuente</span>
                                )}
                                <span>{dias[h.diaSemana]} a las {h.hora}</span>
                              </span>
                              <div className="flex items-center gap-2 sm:ml-2 sm:border-l sm:pl-3 border-current/20 shrink-0">
                                <button
                                  title="Editar este horario"
                                  onClick={() => {
                                    if (editIndex === i) {
                                      setEditIndex(null);
                                      setEditData(null);
                                      return;
                                    }
                                    setEditIndex(i);
                                    setEditData({ diaSemana: h.diaSemana, hora: h.hora, unSoloUso: h.unSoloUso ?? false });
                                  }}
                                  className={`p-1 rounded-md transition-colors ${editIndex === i ? 'bg-blue-200 text-blue-800' : 'hover:bg-black/5'}`}
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  title="Eliminar este horario"
                                  onClick={() => setDeleteScheduleIndex(i)}
                                  className="p-1 rounded-md text-red-500 hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Editor Desplegable */}
                            {editIndex === i && editData && (
                              <div className="mt-2 ml-4 p-3 bg-white border-2 border-blue-200 shadow-lg rounded-xl flex flex-col sm:flex-row gap-3 items-center animate-in slide-in-from-top-2">
                                <div className="flex bg-blue-100 rounded-lg p-1">
                                  <button
                                    onClick={() => setEditData({ ...editData, unSoloUso: false })}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!editData.unSoloUso ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800 hover:bg-blue-200'}`}
                                  >
                                    Frecuente
                                  </button>
                                  <button
                                    onClick={() => setEditData({ ...editData, unSoloUso: true })}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${editData.unSoloUso ? 'bg-blue-600 text-white shadow-sm' : 'text-blue-800 hover:bg-blue-200'}`}
                                  >
                                    Un solo uso
                                  </button>
                                </div>
                                <select
                                  value={editData.diaSemana}
                                  onChange={(e) => setEditData({ ...editData, diaSemana: parseInt(e.target.value) })}
                                  className="bg-gray-50 border border-gray-200 text-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium w-36"
                                >
                                  <option value="1">Lunes</option>
                                  <option value="2">Martes</option>
                                  <option value="3">Miércoles</option>
                                  <option value="4">Jueves</option>
                                  <option value="5">Viernes</option>
                                  <option value="6">Sábado</option>
                                  <option value="0">Domingo</option>
                                </select>
                                <input
                                  type="time"
                                  value={editData.hora}
                                  onChange={(e) => setEditData({ ...editData, hora: e.target.value })}
                                  className="bg-gray-50 border border-gray-200 text-gray-700 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm w-32 font-medium"
                                />
                                <button
                                  onClick={() => {
                                    const newArr = [...config.liveHorariosRecurrentes.horarios];
                                    newArr[i] = { diaSemana: editData.diaSemana, hora: editData.hora, unSoloUso: editData.unSoloUso };
                                    setConfig({ ...config, liveHorariosRecurrentes: { ...config.liveHorariosRecurrentes, horarios: newArr } });
                                    setEditIndex(null);
                                    setEditData(null);
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md active:scale-95"
                                >
                                  Guardar
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
                <p className="text-xs text-red-500/70 mt-2">El Botón Maestro se activará automáticamente llegado el momento. Los de &quot;Un solo uso&quot; se borrarán automáticamente.</p>
              </div>
            </div>
          </div>



          {/* =========================================
            PRIORIDAD 2: PERSONAL Y ADMINISTRADORES
            ========================================= */}
          {/* Gestión de Personal / Administradores */}
          <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
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
                        <span className={u.role === "ADMINISTRADOR"
                          ? "px-2.5 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold tracking-wider"
                          : "px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold tracking-wider"}>
                          {u.role === "ADMINISTRADOR" ? "Administrador" : "Empleado"}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end gap-3 items-center">
                        <button onClick={() => abrirModalVer(u)} className="text-sm font-bold text-foreground/50 hover:text-brand-primary">Ver / Editar</button>
                        <button onClick={() => confirmarBorrarUsuario(u.id, `${u.nombres} ${u.apellidos}`)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors" title="Borrar Empleado">
                          <Trash2 className="w-5 h-5" />
                        </button>
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



          {/* =========================================
            PRIORIDAD 3: PAGOS Y FACTURACIÓN
            ========================================= */}
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
                onChange={e => setConfig({ ...config, bancoNombre: e.target.value })}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Número de Cuenta</label>
              <input
                type="text"
                value={config.bancoCuenta}
                onChange={e => setConfig({ ...config, bancoCuenta: e.target.value })}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">Titular de la Cuenta</label>
              <input
                type="text"
                value={config.bancoTitular}
                onChange={e => setConfig({ ...config, bancoTitular: e.target.value })}
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


          {/* Configuración de QR */}
          <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
              <QrCode className="w-6 h-6 text-brand-primary" /> Código QR
            </h2>

            <div className="flex flex-col items-center gap-6">
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-md">
                {config.qrImagen ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={config.qrImagen} alt="QR" className="w-full h-auto rounded-lg shadow-sm border border-surface-border object-contain" />
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



          {/* =========================================
            PRIORIDAD 4: LOGÍSTICA Y ENVÍOS
            ========================================= */}
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
                      onChange={e => setConfig({ ...config, tiempoReservaMinutos: parseInt(e.target.value) || 4 })}
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
                {DEPARTAMENTOS.map(depto => {
                  const isActive = config.destinosHabilitados[depto] !== undefined;
                  const deptoData = config.destinosHabilitados[depto];

                  return (
                    <div key={depto} className={`border rounded-2xl overflow-hidden transition-colors ${isActive ? 'border-brand-primary/50 bg-brand-primary/5' : 'border-surface-border bg-surface/50'}`}>
                      <div
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-surface transition-colors ${isActive ? 'border-b border-brand-primary/20' : ''}`}
                        onClick={() => toggleDepartamento(depto)}
                      >
                        {isActive ? <CheckSquare className="text-brand-primary w-5 h-5" /> : <Square className="text-foreground/40 w-5 h-5" />}
                        <span className={`font-bold ${isActive ? 'text-brand-primary' : 'text-foreground/70'}`}>{depto}</span>
                      </div>

                      {isActive && deptoData && (
                        <div className="p-4 space-y-4">

                          {/* SECCIÓN PROVINCIAS */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Provincias:</p>
                              <button onClick={() => addProvincia(depto)} className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2 py-1 rounded-md hover:bg-brand-primary/20">+ Añadir</button>
                            </div>
                            {deptoData.provincias.length === 0 ? (
                              <p className="text-xs text-foreground/40 italic">Ninguna provincia agregada.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {deptoData.provincias.map(prov => (
                                  <div key={prov} className="flex items-center gap-1 bg-background border border-surface-border px-2 py-1 rounded-md text-xs">
                                    <span>{prov}</span>
                                    <button onClick={() => removeProvincia(depto, prov)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* SECCIÓN MUNICIPIOS */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider">Municipios:</p>
                              <button onClick={() => addMunicipio(depto)} className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2 py-1 rounded-md hover:bg-brand-primary/20">+ Añadir</button>
                            </div>
                            {deptoData.municipios.length === 0 ? (
                              <p className="text-xs text-foreground/40 italic">Ningún municipio agregado.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {deptoData.municipios.map(mun => (
                                  <div key={mun} className="flex items-center gap-1 bg-background border border-surface-border px-2 py-1 rounded-md text-xs">
                                    <span>{mun}</span>
                                    <button onClick={() => removeMunicipio(depto, mun)} className="text-red-400 hover:text-red-600 ml-1"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



          {/* =========================================
            PRIORIDAD 5: REDES SOCIALES
            ========================================= */}
          {/* Redes Sociales */}
          <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6 border-b border-surface-border pb-4">
              Redes Sociales (Pie de Página)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Instagram URL</label>
                <input
                  type="text"
                  placeholder="https://instagram.com/..."
                  value={config.instagramUrl || ""}
                  onChange={e => setConfig({ ...config, instagramUrl: e.target.value })}
                  className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">Facebook URL</label>
                <input
                  type="text"
                  placeholder="https://facebook.com/..."
                  value={config.facebookUrl || ""}
                  onChange={e => setConfig({ ...config, facebookUrl: e.target.value })}
                  className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">TikTok URL</label>
                <input
                  type="text"
                  placeholder="https://tiktok.com/@..."
                  value={config.tiktokUrl || ""}
                  onChange={e => setConfig({ ...config, tiktokUrl: e.target.value })}
                  className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">WhatsApp Link</label>
                <input
                  type="text"
                  placeholder="https://wa.me/591..."
                  value={config.whatsappUrl || ""}
                  onChange={e => setConfig({ ...config, whatsappUrl: e.target.value })}
                  className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-foreground mb-2">Descripción de la Marca</label>
              <textarea
                rows={3}
                placeholder="Ej: Moda femenina seleccionada para resaltar tu estilo único..."
                value={config.footerDescripcion}
                onChange={e => setConfig({ ...config, footerDescripcion: e.target.value })}
                className="w-full bg-background border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-medium resize-none"
              />
            </div>
          </div>



          {/* =========================================
            PRIORIDAD 6: PÁGINAS LEGALES
            ========================================= */}
          {/* Páginas Legales */}
          <div className="glass p-8 rounded-3xl border border-surface-border shadow-3d space-y-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-surface-border pb-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-brand-primary" /> Textos Legales
              </h2>
              <button
                onClick={() => setExpandedLegalSection(!expandedLegalSection)}
                className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-colors"
              >
                {expandedLegalSection ? "Ocultar Editores de Texto" : "Mostrar / Editar Textos Legales"}
              </button>
            </div>

            {expandedLegalSection && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Términos y Condiciones</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.terminosCondiciones || TERMINOS_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, terminosCondiciones: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Políticas de Envío</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.politicasEnvio || ENVIO_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, politicasEnvio: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Política de Privacidad</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.politicaPrivacidad || POLITICA_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, politicaPrivacidad: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Políticas de Devoluciones</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.politicaDevoluciones || DEVOLUCIONES_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, politicaDevoluciones: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Identidad Legal (NIT, Razón Social)</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.identidadTienda || IDENTIDAD_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, identidadTienda: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Jurisdicción de Disputas</label>
                  <ReactQuill 
                    theme="snow"
                    value={config.jurisdiccion || JURISDICCION_POR_DEFECTO}
                    onChange={(value, delta, source) => { if (source === 'user') setConfig({ ...config, jurisdiccion: value }) }}
                    modules={quillModules}
                    className="mb-4 bg-white min-h-[300px]"
                  />
                </div>
              </div>
            )}

            {/* Vista Previa en Tiempo Real */}
            <div className="mt-8 pt-8 border-t border-surface-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-surface-border pb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brand-primary" /> Vista Previa del Anexo Legal
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setExpandedVistaPrevia(!expandedVistaPrevia)}
                    className="bg-brand-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:brightness-110 transition-colors"
                  >
                    {expandedVistaPrevia ? "Ocultar Vista Previa" : "Mostrar Vista Previa"}
                  </button>
                  <Link href="/privacidad" target="_blank" className="text-sm font-bold bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors shadow-md flex items-center justify-center gap-2">
                    Ver Página Pública (Clientas) &rarr;
                  </Link>
                </div>
              </div>
              <p className="text-sm text-foreground/70 mb-4">Así es exactamente como se imprimirá el texto legal al final de los certificados de cada clienta. ¡Cualquier cambio que hagas arriba se reflejará aquí al instante!</p>

              {expandedVistaPrevia && (
                <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none">
                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2">IDENTIDAD LEGAL:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.identidadTienda || IDENTIDAD_POR_DEFECTO }} />

                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2 mt-8">POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.politicaPrivacidad || POLITICA_POR_DEFECTO }} />

                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2 mt-8">TÉRMINOS Y CONDICIONES:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.terminosCondiciones || TERMINOS_POR_DEFECTO }} />
                  
                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2 mt-8">POLÍTICAS DE ENVÍO:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.politicasEnvio || ENVIO_POR_DEFECTO }} />

                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2 mt-8">POLÍTICAS DE DEVOLUCIONES:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.politicaDevoluciones || DEVOLUCIONES_POR_DEFECTO }} />
                  
                  <h3 className="font-bold text-gray-900 mb-2 uppercase text-xs border-b border-gray-200 pb-2 mt-8">JURISDICCIÓN DE DISPUTAS:</h3>
                  <div dangerouslySetInnerHTML={{ __html: config.jurisdiccion || JURISDICCION_POR_DEFECTO }} />
                </div>
              )}
            </div>
          </div>



          {/* =========================================
            PRIORIDAD 7: MANTENIMIENTO DEL SISTEMA
            ========================================= */}
          {/* Sección de Licencia y Planes */}
          <div className="lg:col-span-2 mt-4">
            <LicenciaPlanes />
          </div>


          {/* Sección de Limpieza de BD */}
          <div className="lg:col-span-2 mt-4">
            <LimpiezaDB />
          </div>



        </div>

        {/* Modal para Añadir Provincia / Municipio */}
        {modalDestino.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-background w-full max-w-sm rounded-3xl p-8 border border-surface-border shadow-2xl relative">
              <h2 className="text-xl font-bold text-foreground mb-2">Añadir {modalDestino.tipo}</h2>
              <p className="text-sm text-foreground/70 mb-6">Departamento: <span className="font-bold">{modalDestino.depto}</span></p>

              <input
                type="text"
                autoFocus
                placeholder={`Nombre del ${modalDestino.tipo === 'Provincia' ? 'la provincia' : 'municipio'}...`}
                value={inputDestino}
                onChange={e => setInputDestino(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGuardarDestino()}
                className="w-full bg-surface border border-surface-border p-4 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-medium mb-6 text-foreground"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setModalDestino({ ...modalDestino, isOpen: false })}
                  className="px-5 py-2.5 rounded-xl font-bold text-foreground/70 hover:bg-surface border border-transparent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarDestino}
                  className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:brightness-110 transition-colors"
                >
                  Añadir
                </button>
              </div>
            </div>
          </div>
        )}

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
                  <input type="text" value={formUsr.nombres} onChange={e => setFormUsr({ ...formUsr, nombres: e.target.value })} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-foreground mb-1">Apellidos</label>
                    <input type="text" value={formUsr.apellidos} onChange={e => setFormUsr({ ...formUsr, apellidos: e.target.value })} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                  <div className="w-1/2">
                    <label className="block text-sm font-bold text-foreground mb-1">C.I. *</label>
                    <input type="text" value={formUsr.ci} onChange={e => setFormUsr({ ...formUsr, ci: e.target.value })} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Teléfono</label>
                  <input type="text" value={formUsr.telefono} onChange={e => setFormUsr({ ...formUsr, telefono: e.target.value })} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary" />
                </div>

                <div className="border-t border-surface-border my-4 pt-4"></div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Usuario de Acceso (Login) *</label>
                  <input type="text" value={formUsr.username} onChange={e => setFormUsr({ ...formUsr, username: e.target.value })} disabled={!!usuarioActivo} className={`w-full p-3 rounded-xl outline-none font-bold ${usuarioActivo ? 'bg-surface/50 border border-surface-border text-foreground/60 cursor-not-allowed' : 'bg-surface border border-surface-border focus:ring-2 focus:ring-brand-primary'}`} />
                </div>

                <div className="relative">
                  <label className="block text-sm font-bold text-brand-primary mb-1">PIN / Contraseña de Acceso *</label>
                  <input type={verPin ? "text" : "password"} value={formUsr.pin} onChange={e => setFormUsr({ ...formUsr, pin: e.target.value })} className="w-full bg-brand-primary/5 border border-brand-primary/30 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold tracking-widest text-brand-primary pr-12" />
                  <button type="button" onClick={() => setVerPin(!verPin)} className="absolute right-3 top-9 text-brand-primary/60 hover:text-brand-primary">
                    {verPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-1">Rol</label>
                  <select value={formUsr.role} onChange={e => setFormUsr({ ...formUsr, role: e.target.value })} className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary font-bold">
                    <option value="EMPLEADO">Empleado (Caja / Ventas)</option>
                    <option value="ADMINISTRADOR">Administrador</option>
                  </select>
                </div>
              </div>

              {formUsr.role === "EMPLEADO" && (
                <div className="mt-6 border-t border-surface-border pt-4">
                  <label className="block text-sm font-bold text-foreground mb-3">Permisos de Acceso</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { id: "ACCESO_CAJA", label: "Caja (Vender)" },
                      { id: "ACCESO_PEDIDOS", label: "Pedidos (Gestión)" },
                      { id: "ACCESO_CATALOGO", label: "Catálogo (Ver)" },
                      { id: "EDITAR_CATALOGO", label: "Catálogo (Crear/Editar)" },
                      { id: "ACCESO_CLIENTAS", label: "Clientas (Base de datos)" },
                      { id: "ACCESO_REPORTES", label: "Reportes Financieros" },
                      { id: "ACCESO_CONFIGURACION", label: "Configuración General" },
                    ].map(perm => (
                      <label key={perm.id} className="flex items-center gap-3 p-3 bg-surface border border-surface-border rounded-xl cursor-pointer hover:bg-surface-border/50 transition-colors">
                        <input
                          type="checkbox"
                          className="w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
                          checked={formUsr.permisos.includes(perm.id)}
                          onChange={(e) => {
                            const newPerms = e.target.checked
                              ? [...formUsr.permisos, perm.id]
                              : formUsr.permisos.filter(p => p !== perm.id);
                            setFormUsr({ ...formUsr, permisos: newPerms });
                          }}
                        />
                        <span className="text-sm font-medium">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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

        {/* MODAL ELIMINAR USUARIO */}
        {usuarioAEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                  <Trash2 className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-center text-foreground mb-2">Eliminar Empleado</h3>
              <p className="text-center text-foreground/70 mb-6">
                ¿Estás segura de que quieres borrar al usuario <strong className="text-foreground">{usuarioAEliminar.nombre}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setUsuarioAEliminar(null)}
                  className="flex-1 py-3 px-4 bg-surface-border text-foreground rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  disabled={savingUsr}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBorrarUsuario}
                  disabled={savingUsr}
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2"
                >
                  {savingUsr ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : "Sí, Eliminar"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL ELIMINAR HORARIO LIVE */}
        {deleteScheduleIndex !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-red-50 p-6 flex flex-col items-center justify-center border-b border-red-100">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 text-center">Eliminar horario</h3>
              </div>

              <div className="p-6 text-center">
                <p className="text-gray-600 mb-6">
                  ¿Estás segura de que deseas eliminar este horario de LIVE? Esta acción no se puede deshacer.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteScheduleIndex(null)}
                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const newArr = [...config.liveHorariosRecurrentes.horarios];
                      newArr.splice(deleteScheduleIndex, 1);
                      setConfig({ ...config, liveHorariosRecurrentes: { ...config.liveHorariosRecurrentes, horarios: newArr } });
                      if (editIndex === deleteScheduleIndex) {
                        setEditIndex(null);
                        setEditData(null);
                      }
                      setDeleteScheduleIndex(null);
                    }}
                    className="flex-1 bg-red-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-200"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Botón Flotante para Guardar */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end gap-2">
        <div className={`
          px-4 py-2 rounded-full text-xs font-bold shadow-lg transition-all duration-300 transform
          ${mensajeConfig
            ? mensajeConfig.includes('Error')
              ? 'bg-red-100 text-red-600 scale-100 opacity-100'
              : 'bg-green-100 text-green-600 scale-100 opacity-100'
            : 'bg-yellow-100 text-yellow-700 scale-100 opacity-100'
          }
        `}>
          {mensajeConfig || "⚠️ Recuerde guardar para aplicar sus modificaciones"}
        </div>
        <button
          onClick={() => setIsConfirmGuardarOpen(true)}
          disabled={savingConfig}
          className="bg-brand-primary text-white p-4 md:px-8 md:py-4 rounded-full shadow-2xl hover:bg-brand-accent hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
        >
          {savingConfig ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-6 h-6 md:w-5 md:h-5" />
          )}
          <span className="hidden md:inline font-bold text-lg">Guardar Cambios</span>
        </button>
      </div>

      {/* MODAL DE CONFIRMACION PARA GUARDAR */}
      {isConfirmGuardarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center relative animate-in zoom-in-95 duration-200 border border-surface-border">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Save className="w-8 h-8 text-brand-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">¿Guardar los cambios?</h3>
            <p className="text-sm text-foreground/70 mb-6">
              Esta acción actualizará la configuración de tu tienda inmediatamente para todas tus clientas.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsConfirmGuardarOpen(false)}
                className="flex-1 bg-surface-border text-foreground font-bold py-3 rounded-xl hover:bg-surface-border/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsConfirmGuardarOpen(false);
                  handleSaveConfig();
                }}
                className="flex-1 bg-brand-primary text-white font-bold py-3 rounded-xl hover:bg-brand-accent transition-colors"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Espaciador inferior para no tapar contenido con el botón flotante */}
      <div className="h-24"></div>
    </>
  );
}
