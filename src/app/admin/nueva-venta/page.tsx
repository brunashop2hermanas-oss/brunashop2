"use client";
import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Minus, Trash2, CheckCircle2, UserPlus, CreditCard, Banknote, QrCode, Truck, PackageCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPrendas } from '@/app/actions/productos';
import { getConfiguracion } from '@/app/actions/config';
import { getClientaByCI } from '@/app/actions/clientas';
import { createVenta } from '@/app/actions/ventas';
import { uploadImage } from '@/app/actions/upload';
import { compressImage } from '@/lib/imageCompression';
import toast from "react-hot-toast";

export default function NuevaVenta() {
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<{ id: string, itemUnicoId: string, nombre: string, precio: number, cantidad: number, tallaSeleccionada: string, colorSeleccionado: string }[]>([]);
  
  // Datos de la Clienta
  const [ci, setCi] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidoPaterno, setApellidoPaterno] = useState('');
  const [apellidoMaterno, setApellidoMaterno] = useState('');
  const [celular, setCelular] = useState('');
  const [clientaExistente, setClientaExistente] = useState(false);
  const [buscandoCi, setBuscandoCi] = useState(false);

  const [metodoPago, setMetodoPago] = useState<string>('efectivo');
  const [tipoEntrega, setTipoEntrega] = useState<'directa' | 'envio'>('directa');
  const [destino, setDestino] = useState<string>('');
  const [provinciaDestino, setProvinciaDestino] = useState<string>('');
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [departamentosHabilitados, setDepartamentosHabilitados] = useState<string[]>([]);
  const [provinciasHabilitadas, setProvinciasHabilitadas] = useState<string[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  
  const [showClientModal, setShowClientModal] = useState(false);
  const [showNuevaClienta, setShowNuevaClienta] = useState(false);
  
  const [ventaCompletada, setVentaCompletada] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vendedora, setVendedora] = useState('Dueña');
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productoVistaRapida, setProductoVistaRapida] = useState<any>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatos = async () => {
      const res = await getPrendas();
      if (res.success) {
        setProductos(res.data || []);
      }
      const configRes = await getConfiguracion();
      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
        if (configRes.data.destinosHabilitados) {
          setDepartamentosHabilitados(Object.keys(configRes.data.destinosHabilitados));
        }
      }
    };
    fetchDatos();
  }, []);

  const handleDeptoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setDestino(val);
    if (config?.destinosHabilitados && config.destinosHabilitados[val]) {
      setProvinciasHabilitadas(config.destinosHabilitados[val]);
      setProvinciaDestino('');
    } else {
      setProvinciasHabilitadas([]);
      setProvinciaDestino('');
    }
  };

  
  

  
  // Cálculos matemáticos
  const totalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalOriginalCarrito = carrito.reduce((acc, item) => {
    const prodDb = productos.find(p => p.id === item.id);
    const precioOriginal = prodDb?.precioOriginal && prodDb.precioOriginal > item.precio ? prodDb.precioOriginal : item.precio;
    return acc + (precioOriginal * item.cantidad);
  }, 0);
  const ahorroTotal = totalOriginalCarrito - totalCarrito;

  const agregarAlCarrito = (prod: any) => {
    if (prod.stockCount <= 0 && !prod.enPreventa) return;
    if ((prod.tallas && prod.tallas.length > 0) || (prod.colores && prod.colores.length > 0) || prod.isConjunto) {
      setProductoVistaRapida(prod);
      return;
    }
    agregarAlCarritoDefinitivo(prod, "", "");
  };

  const agregarAlCarritoDefinitivo = (prod: any, talla: string, color: string) => {
    setCarrito(prev => {
      const itemUnicoId = `${prod.id}-${talla}-${color}`;
      const existe = prev.find(item => item.itemUnicoId === itemUnicoId);
      if (existe) {
        if (existe.cantidad >= prod.stockCount && prod.stockCount > 0) {
          toast.error("No hay más stock de esta prenda.");
          return prev;
        }
        return prev.map(item => item.itemUnicoId === itemUnicoId ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { id: prod.id, itemUnicoId, nombre: prod.nombre, precio: prod.precioVenta, cantidad: 1, tallaSeleccionada: talla, colorSeleccionado: color }];
    });
    setProductoVistaRapida(null);
  };

  const modificarCantidad = (itemUnicoId: string, delta: number) => {
    setCarrito(prev => prev.map(item => {
      if (item.itemUnicoId === itemUnicoId) {
        const prodDb = productos.find(p => p.id === item.id);
        const nuevaCantidad = item.cantidad + delta;
        if (prodDb && nuevaCantidad > prodDb.stockCount) {
          toast.error("Stock máximo alcanzado");
          return item;
        }
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item;
      }
      return item;
    }));
  };

  const eliminarDelCarrito = (itemUnicoId: string) => {
    setCarrito(prev => prev.filter(item => item.itemUnicoId !== itemUnicoId));
  };

  const handleBuscarCI = async () => {
    if (ci.length < 5) return;
    setBuscandoCi(true);
    const res = await getClientaByCI(ci);
    if (res.success && res.data) {
      setClientaExistente(true);
      setNombres(res.data.nombres || '');
      setApellidoPaterno(res.data.apellidos || '');
      setApellidoMaterno('');
      setCelular(res.data.celular || '');
      setShowClientModal(false); // Cierra el modal de búsqueda
    } else {
      setClientaExistente(false);
      // No la encontró, le sugerimos crear una nueva
    }
    setBuscandoCi(false);
  };

  const confirmarNuevaClienta = () => {
    if (!nombres || !apellidoPaterno || !ci || !celular) {
      toast.error("Por favor llena todos los campos de la clienta.");
      return;
    }
    setClientaExistente(false);
    setShowNuevaClienta(false);
    setShowClientModal(false);
  };

  
  const completarVenta = async () => {
    if (carrito.length === 0) return;
    
    // Si es envío, requerimos todos los datos
    if (tipoEntrega === 'envio') {
      if (!ci || !nombres || !apellidoPaterno || !celular) {
        toast.error("Para envíos es obligatorio registrar los datos del cliente (CI, Nombres, Apellido y Celular).");
        return;
      }
      if (!destino) { toast.error("Debes seleccionar el departamento."); return; }
    } else {
      // Si es tienda y empezó a llenar datos, pedir que complete
      if ((ci || nombres || apellidoPaterno || celular) && (!ci || !nombres || !apellidoPaterno || !celular)) {
        toast.error("Para registrar al cliente completa sus datos. Si es venta rápida, deja los campos vacíos.");
        return;
      }
    }

    if (metodoPago === 'qr' && !comprobanteUrl && !comprobanteFile) { toast.error("Debes subir el comprobante del pago QR."); return; }

    setIsSubmitting(true);
    let finalComprobanteUrl = comprobanteUrl;

    if (metodoPago === 'qr' && comprobanteFile && !comprobanteUrl) {
      setIsUploading(true);
      try {
        const compressed = await compressImage(comprobanteFile);
        const formData = new FormData();
        formData.append("file", compressed);
        const uploadRes = await uploadImage(formData);
        if (uploadRes.success) {
          finalComprobanteUrl = uploadRes.url || null;
        } else {
          toast.error("Error subiendo comprobante: " + uploadRes.error);
          setIsSubmitting(false);
          setIsUploading(false);
          return;
        }
      } catch (err) {
        toast.error("Error al comprimir o subir la imagen.");
        setIsSubmitting(false);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const itemsParaBD = carrito.map(item => ({
      prendaId: item.id,
      cantidad: item.cantidad,
      precioUnitario: item.precio,
      talla: item.tallaSeleccionada || undefined,
      color: item.colorSeleccionado || undefined
    }));

    const data = {
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      ci,
      celular,
      ciudadDestino: tipoEntrega === 'envio' ? destino : 'Tienda Física',
      provinciaDestino: tipoEntrega === 'envio' ? provinciaDestino : undefined,
      items: itemsParaBD,
      total: totalCarrito,
      origen: 'POS',
      estado: tipoEntrega === 'envio' ? 'PREPARANDO' : 'ENTREGADO',
      metodoPago: metodoPago === 'qr' ? 'TRANSFERENCIA_QR' : 'EFECTIVO',
      tipoEntrega: tipoEntrega === 'envio' ? 'ENVIO' : 'TIENDA',
      comprobanteUrl: finalComprobanteUrl || undefined
    };

    const res = await createVenta(data);
    setIsSubmitting(false);

    if (res.success) {
      setVentaCompletada(true);
      const prodRes = await getPrendas();
      if (prodRes.success) setProductos(prodRes.data || []);
      toast.success("Venta registrada exitosamente.");
    } else {
      toast.error("Error al procesar la venta: " + res.error);
    }
  };

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(busquedaProducto.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-brand-primary font-serif tracking-tight">Caja / Nueva Venta</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-foreground/60 text-sm">Punto de Venta (Caja) - Atendido por:</span>
            <select 
              value={vendedora} 
              onChange={(e) => setVendedora(e.target.value)}
              className="bg-brand-primary/10 text-brand-primary font-bold border border-brand-primary/20 rounded-lg px-2 py-1 text-sm outline-none cursor-pointer"
            >
              <option value="Dueña">Dueña</option>
              <option value="María">María</option>
              <option value="Valeria">Valeria</option>
              <option value="Carla">Carla</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Catálogo Búsqueda (Izquierda) */}
        <div className="lg:col-span-2 glass rounded-3xl border border-surface-border shadow-3d flex flex-col max-h-[80vh]">
          <div className="p-6 border-b border-surface-border bg-surface/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 w-5 h-5" />
              <input 
                type="text" 
                value={busquedaProducto}
                onChange={(e) => setBusquedaProducto(e.target.value)}
                placeholder="Buscar prenda por nombre..." 
                className="w-full bg-background border border-surface-border p-4 pl-12 rounded-2xl outline-none focus:ring-2 focus:ring-brand-primary transition-all font-medium"
              />
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <p className="col-span-full text-center text-foreground/50 py-10">No hay productos en inventario.</p>
            ) : productosFiltrados.map((prod) => (
              <div 
                key={prod.id} 
                onClick={() => agregarAlCarrito(prod)}
                className={`bg-background border border-surface-border rounded-2xl p-4 transition-colors flex flex-col ${prod.stockCount > 0 ? 'hover:border-brand-primary cursor-pointer group' : 'opacity-50 cursor-not-allowed'}`}
              >
                <div className="bg-surface rounded-xl aspect-square mb-3 flex items-center justify-center relative overflow-hidden">
                  {prod.imagenes && prod.imagenes[0] ? (
                    <img src={prod.imagenes[0]} alt={prod.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">👗</span>
                  )}
                  {prod.stockCount <= 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">AGOTADO</span>
                  )}
                  {prod.stockCount > 0 && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
                      <span className="bg-brand-primary text-background px-4 py-2 rounded-full font-bold text-sm">Añadir +</span>
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-foreground text-sm leading-tight mb-1">{prod.nombre}</h3>
                <p className="text-xs text-foreground/50 mb-2">Stock: {prod.stockCount}</p>
                
                <div className="mt-auto flex items-end gap-2">
                  <p className="font-black text-brand-primary">Bs. {prod.precioVenta}</p>
                  {prod.precioOriginal && prod.precioOriginal > prod.precioVenta && (
                    <p className="text-xs text-foreground/40 line-through font-bold mb-[2px]">Bs. {prod.precioOriginal}</p>
                  )}
                </div>
  
              </div>
            ))}
          </div>
        </div>

        {/* Carrito / Ticket (Derecha) */}
        <div className="glass rounded-3xl border border-surface-border shadow-3d flex flex-col h-max max-h-[80vh] overflow-y-auto">
          <div className="p-6 border-b border-surface-border bg-brand-primary/5">
            <h2 className="font-serif font-bold text-xl text-brand-primary flex justify-between items-center">
              Venta Actual
              <span className="bg-brand-primary/20 text-brand-primary text-xs px-2 py-1 rounded-md">{carrito.length} ítems</span>
            </h2>
          </div>
          
          <div className="p-4 space-y-3">
            {carrito.map((item) => {
              const prodDb = productos.find(p => p.id === item.id);
              return (
              <div key={item.itemUnicoId} className="bg-background border border-surface-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface border border-surface-border">
                    {prodDb?.imagenes?.[0] ? <img src={prodDb.imagenes[0]} className="w-full h-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-xs">👗</span>}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-foreground truncate max-w-[150px]">{item.nombre}</h4>
                    {(item.tallaSeleccionada || item.colorSeleccionado) && (
                      <p className="text-[10px] text-foreground/50 uppercase font-bold mt-0.5">
                        {item.tallaSeleccionada && `T: ${item.tallaSeleccionada}`} {item.tallaSeleccionada && item.colorSeleccionado && '|'} {item.colorSeleccionado && `C: ${item.colorSeleccionado}`}
                      </p>
                    )}
                    {prodDb?.isConjunto && prodDb.piezasDetalle && (
                       <ul className="flex flex-col gap-1 mt-2">
                         {Object.values(typeof prodDb.piezasDetalle === 'string' ? JSON.parse(prodDb.piezasDetalle) : prodDb.piezasDetalle).map((pieza: any) => {
                           const pRef = productos.find(p => p.id === pieza.id);
                           if (!pRef) return null;
                           return (
                             <li key={pieza.id} className="flex gap-2 text-xs items-center">
                               <div className="w-6 h-6 rounded-md overflow-hidden shrink-0 bg-surface border border-surface-border">
                                 {pRef.imagenes?.[0] ? <img src={pRef.imagenes[0]} className="w-full h-full object-cover" /> : null}
                               </div>
                               <div className="flex-1 text-foreground/80">
                                 <span className="font-bold">{pieza.cantidad}x</span> {pRef.nombre}
                                 {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                                   <span className="text-[10px] uppercase font-bold text-foreground/50 ml-1">
                                     ({pieza.tallaEspecifica ? `T:${pieza.tallaEspecifica}` : ''} {pieza.colorEspecifico ? `C:${pieza.colorEspecifico}` : ''})
                                   </span>
                                 )}
                               </div>
                             </li>
                           );
                         })}
                       </ul>
                    )}
                    <p className="text-brand-primary font-bold text-sm mt-1">Bs. {item.precio}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-surface rounded-lg border border-surface-border">
                    <button onClick={() => modificarCantidad(item.itemUnicoId, -1)} className="p-1 hover:text-brand-primary"><Minus className="w-4 h-4" /></button>
                    <span className="w-5 text-center text-sm font-bold">{item.cantidad}</span>
                    <button onClick={() => modificarCantidad(item.itemUnicoId, 1)} className="p-1 hover:text-brand-primary"><Plus className="w-4 h-4" /></button>
                  </div>
                  <button onClick={() => eliminarDelCarrito(item.itemUnicoId)} className="p-1 text-foreground/30 hover:text-red-500 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )})}
            {carrito.length === 0 && (
              <p className="text-center text-sm text-foreground/50 py-4">Añade prendas a la venta.</p>
            )}
          </div>

          <div className="p-6 border-t border-surface-border bg-surface/50 space-y-4">
            
            {/* Asignar Clienta (Abre Modal) */}
            <div 
              onClick={() => setShowClientModal(true)}
              className="bg-background rounded-xl p-3 border border-surface-border flex items-center justify-between cursor-pointer hover:border-brand-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {nombres ? `${nombres} ${apellidoPaterno} ${apellidoMaterno}`.trim() : 'Asignar Clienta'}
                  </p>
                  <p className="text-xs text-foreground/50">
                    {ci ? `CI: ${ci} ${clientaExistente ? '(VIP)' : '(Nueva)'}` : 'Para acumular puntos VIP'}
                  </p>
                </div>
              </div>
              <span className="text-brand-primary text-sm font-bold">{nombres ? 'Cambiar >' : 'Buscar >'}</span>
            </div>

            {/* Tipo de Entrega */}
            <div className="bg-background rounded-xl border border-surface-border p-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setTipoEntrega('directa')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${tipoEntrega === 'directa' ? 'bg-brand-primary text-background' : 'text-foreground/60 hover:bg-surface'}`}
                >
                  <PackageCheck className="w-4 h-4" /> Tienda
                </button>
                <button 
                  onClick={() => setTipoEntrega('envio')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${tipoEntrega === 'envio' ? 'bg-brand-primary text-background' : 'text-foreground/60 hover:bg-surface'}`}
                >
                  <Truck className="w-4 h-4" /> Envío
                </button>
              </div>
              
              <AnimatePresence>
                {tipoEntrega === 'envio' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: 'auto', opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-3"
                  >
                    
                    <div className="space-y-2">
                      <select 
                        value={destino}
                        onChange={handleDeptoChange}
                        className="w-full bg-surface border border-surface-border rounded-lg p-2 text-sm outline-none focus:border-brand-primary cursor-pointer appearance-none"
                      >
                        <option value="">Selecciona Departamento...</option>
                        {departamentosHabilitados.length > 0 ? (
                          departamentosHabilitados.map(d => <option key={d} value={d}>{d}</option>)
                        ) : (
                          <>
                            <option value="La Paz">La Paz</option>
                            <option value="Cochabamba">Cochabamba</option>
                            <option value="Santa Cruz">Santa Cruz</option>
                            <option value="Oruro">Oruro</option>
                            <option value="Potosí">Potosí</option>
                            <option value="Chuquisaca">Chuquisaca (Sucre)</option>
                            <option value="Tarija">Tarija</option>
                            <option value="Beni">Beni</option>
                            <option value="Pando">Pando</option>
                          </>
                        )}
                      </select>
                      {provinciasHabilitadas.length > 0 && (
                        <select 
                          value={provinciaDestino}
                          onChange={(e) => setProvinciaDestino(e.target.value)}
                          className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:border-brand-primary cursor-pointer appearance-none text-sm"
                        >
                          <option value="">Selecciona Provincia/Municipio...</option>
                          {provinciasHabilitadas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      )}
                    </div>
  
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            
            {/* Resumen */}
            <div className="space-y-1 pt-2 border-t border-surface-border">
              {ahorroTotal > 0 && (
                <>
                  <div className="flex justify-between text-sm text-foreground/50 line-through">
                    <span>Total Original</span>
                    <span>Bs. {totalOriginalCarrito.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-500 font-bold">
                    <span>Ahorro / Descuento</span>
                    <span>- Bs. {ahorroTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-2xl font-black text-foreground pt-1">
                <span>Total Pagar</span>
                <span className="text-brand-primary">Bs. {totalCarrito.toFixed(2)}</span>
              </div>
            </div>


            {/* Método de Pago */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setMetodoPago('efectivo')}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-colors ${metodoPago === 'efectivo' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-surface-border bg-background text-foreground/60 hover:border-brand-primary/50'}`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-bold">Efectivo</span>
              </button>
              <button 
                onClick={() => setMetodoPago('qr')}
                className={`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-colors ${metodoPago === 'qr' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-surface-border bg-background text-foreground/60 hover:border-brand-primary/50'}`}
              >
                <QrCode className="w-4 h-4" />
                <span className="text-xs font-bold">QR / Transf</span>
              </button>
            </div>

            <AnimatePresence>
              {metodoPago === 'qr' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-2 border-2 border-dashed border-surface-border rounded-xl p-4 text-center hover:border-brand-primary transition-colors bg-surface relative">
                    {!comprobanteFile && !comprobanteUrl ? (
                      <>
                        <p className="text-xs text-foreground/60 mb-2">Haz clic para subir captura del pago</p>
                        <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setComprobanteFile(e.target.files[0]);
                          }
                        }} />
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <img src={comprobanteFile ? URL.createObjectURL(comprobanteFile) : comprobanteUrl!} alt="Comprobante" onClick={() => setImagenAmpliada(comprobanteFile ? URL.createObjectURL(comprobanteFile) : comprobanteUrl!)} className="w-20 h-20 object-cover rounded-lg shadow-md border border-surface-border cursor-pointer hover:opacity-80 transition-opacity" />
                        <div className="flex gap-2 w-full">
                          <button onClick={() => { setComprobanteFile(null); setComprobanteUrl(null); }} className="flex-1 bg-red-500/10 text-red-500 text-xs font-bold py-1.5 rounded-lg">Borrar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>


            <button 
              onClick={completarVenta}
              disabled={isSubmitting || carrito.length === 0}
              className="w-full bg-brand-primary text-background font-bold py-4 rounded-xl text-lg hover:brightness-110 transition-all shadow-lg hover:shadow-brand-primary/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Completar Venta'} <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Vista Rápida POS */}
      <AnimatePresence>
        {productoVistaRapida && (
          <ModalPOSVistaRapida 
            producto={productoVistaRapida} 
            productosAll={productos} 
            cerrar={() => setProductoVistaRapida(null)} 
            agregar={agregarAlCarritoDefinitivo} 
          />
        )}
      </AnimatePresence>

      {/* Modal Imagen Ampliada */}
      <AnimatePresence>
        {imagenAmpliada && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setImagenAmpliada(null)}
          >
            <button 
              onClick={() => setImagenAmpliada(null)}
              className="absolute top-6 right-6 text-white hover:text-brand-primary bg-black/50 p-2 rounded-full transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={imagenAmpliada} 
              className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Modal Venta Completada */}
      <AnimatePresence>
        {ventaCompletada && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-background w-full max-w-md rounded-3xl border border-surface-border shadow-2xl relative my-auto text-center flex flex-col items-center max-h-[90vh]"
            >
              <div className="p-8 overflow-y-auto w-full flex flex-col items-center">
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 shrink-0">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black font-serif text-foreground mb-2">¡Venta Exitosa!</h2>
              <p className="text-foreground/60 mb-2">El pago por <strong className="text-brand-primary">Bs. {totalCarrito.toFixed(2)}</strong> ha sido registrado en la base de datos.</p>
              
              <div className="bg-surface border border-surface-border rounded-xl p-3 mb-6 w-full text-left">
                <p className="text-sm border-b border-surface-border pb-2 mb-2"><strong>Clienta:</strong> {nombres ? `${nombres} ${apellidoPaterno} ${apellidoMaterno}` : 'Cliente Anónimo (Venta Rápida)'}</p>
                <p className="text-sm"><strong>Tipo de Entrega:</strong> {tipoEntrega === 'directa' ? 'Directa en Tienda' : 'Envío'}</p>
                {nombres && <p className="text-sm mt-1"><strong>Puntos:</strong> +{carrito.reduce((acc, it) => acc + it.cantidad, 0)} puntos para la clienta.</p>}
              </div>
              
              
              <div className="w-full space-y-3">
                {celular && (
                  <a 
                    href={`https://wa.me/591${celular.replace(/\s/g, '')}?text=${encodeURIComponent(`¡Hola ${nombres}! 🌸 Hemos registrado tu compra exitosamente en BrunaShop 2 Hermanas.\n\n*Detalles de tu pedido:*\nTotal: Bs. ${totalCarrito.toFixed(2)}\n${tipoEntrega === 'envio' ? `Envío a: ${destino} - ${provinciaDestino}\nEstado: PREPARANDO 📦` : 'Estado: ENTREGADO EN TIENDA ✅'}\n\n¡Gracias por tu preferencia! ✨`)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:brightness-110 transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    Confirmar a Clienta por WhatsApp
                  </a>
                )}
                <button 
                  onClick={() => {
                    setVentaCompletada(false);
                    setCarrito([]);
                    setCi('');
                    setNombres('');
                    setApellidoPaterno('');
                    setApellidoMaterno('');
                    setCelular('');
                    setDestino('');
                    setProvinciaDestino('');
                    setClientaExistente(false);
                    setComprobanteFile(null);
                    setComprobanteUrl(null);
                  }}
                  className="w-full bg-brand-primary text-background font-bold py-3 rounded-xl hover:brightness-110 transition-colors shadow-lg"
                >
                  Nueva Venta
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Selección de Clienta */}
      <AnimatePresence>
        {showClientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-background w-full max-w-lg rounded-3xl border border-surface-border shadow-2xl relative my-auto flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-surface-border shrink-0">
                <h2 className="text-2xl font-black font-serif text-foreground">Buscar Clienta</h2>
                <button onClick={() => setShowClientModal(false)} className="text-foreground/50 hover:text-foreground">X</button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <div className="relative mb-4 flex gap-2">
                <input 
                  type="text" 
                  value={ci}
                  onChange={(e) => setCi(e.target.value)}
                  placeholder="Ingrese Carnet de Identidad (CI)..." 
                  className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                />
                <button 
                  onClick={handleBuscarCI}
                  disabled={buscandoCi || !ci}
                  className="bg-brand-primary text-background px-4 rounded-xl font-bold hover:brightness-110 flex items-center justify-center min-w-[100px]"
                >
                  {buscandoCi ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </div>

              {!clientaExistente && ci && !buscandoCi && (
                <div className="text-center py-6 text-foreground/60 text-sm">
                  <p>Clienta no encontrada con el CI: {ci}</p>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-surface-border flex justify-between">
                <button 
                  onClick={() => {
                    setCi(''); setNombres(''); setApellidoPaterno(''); setApellidoMaterno(''); setCelular('');
                    setShowClientModal(false);
                  }}
                  className="text-foreground/60 hover:text-foreground text-sm font-bold"
                >
                  Quitar Clienta (Venta Casual)
                </button>
                <button 
                  onClick={() => setShowNuevaClienta(true)}
                  className="bg-brand-primary text-background px-4 py-2 rounded-lg text-sm font-bold flex gap-2 items-center hover:brightness-110"
                >
                  <UserPlus className="w-4 h-4" /> Nueva Clienta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Nueva Clienta Rápida */}
      <AnimatePresence>
        {showNuevaClienta && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-background w-full max-w-lg rounded-3xl border border-surface-border shadow-2xl relative my-auto flex flex-col max-h-[90vh]"
            >
              <div className="p-6 overflow-y-auto flex-1">
              <h2 className="text-xl font-black font-serif text-foreground mb-4">Registrar Nueva Clienta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground/60 mb-1 block">Carnet de Identidad (CI) *</label>
                  <input 
                    type="text" 
                    value={ci}
                    onChange={(e) => setCi(e.target.value)}
                    placeholder="Ej. 1234567"
                    className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                  />
                </div>
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-foreground/60 mb-1 block">Nombres *</label>
                    <input 
                      type="text" 
                      value={nombres}
                      onChange={(e) => setNombres(e.target.value)}
                      placeholder="Ej. María Fernanda"
                      className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground/60 mb-1 block">Apellido Paterno *</label>
                    <input 
                      type="text" 
                      value={apellidoPaterno}
                      onChange={(e) => setApellidoPaterno(e.target.value)}
                      placeholder="Ej. Pérez"
                      className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground/60 mb-1 block">Apellido Materno</label>
                    <input 
                      type="text" 
                      value={apellidoMaterno}
                      onChange={(e) => setApellidoMaterno(e.target.value)}
                      placeholder="Ej. Gómez"
                      className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-foreground/60 mb-1 block">Número de Celular *</label>
                  <input 
                    type="tel" 
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    placeholder="Ej. 71234567"
                    className="w-full bg-surface border border-surface-border p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={confirmarNuevaClienta}
                  className="w-full bg-brand-primary text-background font-bold py-3 rounded-xl hover:brightness-110 transition-colors shadow-lg"
                >
                  Guardar y Asignar
                </button>
                <button 
                  onClick={() => setShowNuevaClienta(false)}
                  className="w-full bg-surface text-foreground font-bold py-3 rounded-xl border border-surface-border hover:border-brand-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


function ModalPOSVistaRapida({ producto, productosAll, cerrar, agregar }: { producto: any, productosAll: any[], cerrar: () => void, agregar: (p:any, t:string, c:string) => void }) {
  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const tallas = producto.tallas || [];
  const colores = producto.colores || [];

  const handleAgregar = () => {
    if (!producto.isConjunto) {
      if (tallas.length > 0 && !talla) { toast.error("Elige una talla"); return; }
      if (colores.length > 0 && !color) { toast.error("Elige un color"); return; }
    }
    agregar(producto, talla, color);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-background w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 bg-surface border-b border-surface-border flex justify-between items-center">
          <h3 className="font-bold text-lg font-serif truncate pr-4">{producto.nombre}</h3>
          <button onClick={cerrar} className="text-foreground/50 hover:text-foreground"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex gap-4 mb-4">
             <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface border border-surface-border">
                {producto.imagenes?.[0] ? <img src={producto.imagenes[0]} className="w-full h-full object-cover" /> : null}
             </div>
             <div>
                <span className="text-3xl font-black text-brand-primary block mt-2">Bs. {producto.precioVenta}</span>
                {producto.precioOriginal && producto.precioOriginal > producto.precioVenta && (
                  <span className="text-sm line-through text-foreground/40 block">Bs. {producto.precioOriginal}</span>
                )}
             </div>
          </div>
          
          {producto.isConjunto && producto.piezasDetalle && (
            <div className="mb-6 bg-surface p-4 rounded-xl border border-surface-border">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/50 block mb-3">Piezas del Conjunto:</span>
              <ul className="space-y-3">
                {Object.values(typeof producto.piezasDetalle === 'string' ? JSON.parse(producto.piezasDetalle) : producto.piezasDetalle).map((pieza: any) => {
                  const pRef = productosAll.find(p => p.id === pieza.id);
                  return (
                    <li key={pieza.id} className="flex gap-3 text-sm items-center">
                      <div className="w-12 h-12 rounded-md overflow-hidden shrink-0 bg-surface border border-surface-border">
                        {pRef?.imagenes?.[0] ? <img src={pRef.imagenes[0]} className="w-full h-full object-cover" /> : null}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold">{pieza.cantidad}x</span> {pRef?.nombre || "Prenda"}
                        {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                          <div className="text-[10px] text-foreground/50 uppercase font-bold mt-1">
                            {pieza.tallaEspecifica && `T: ${pieza.tallaEspecifica} `}
                            {pieza.colorEspecifico && `| C: ${pieza.colorEspecifico}`}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {!producto.isConjunto && tallas.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest block mb-2">Tallas Disponibles</span>
              <div className="flex gap-2 flex-wrap">
                {tallas.map((t: string) => (
                  <button key={t} onClick={() => setTalla(t)} className={`px-4 py-2 text-sm rounded-lg border transition-all ${talla === t ? 'border-brand-primary bg-brand-primary text-white font-bold' : 'border-surface-border bg-surface text-foreground'}`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {!producto.isConjunto && colores.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest block mb-2">Colores</span>
              <div className="flex gap-2 flex-wrap">
                {colores.map((c: string) => (
                  <button key={c} onClick={() => setColor(c)} className={`px-4 py-2 text-sm rounded-lg border transition-all capitalize ${color === c ? 'border-brand-primary bg-brand-primary text-white font-bold' : 'border-surface-border bg-surface text-foreground'}`}>{c}</button>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleAgregar} className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl mt-4 shadow-lg flex items-center justify-center gap-2 hover:brightness-110">
            Confirmar y Añadir <Plus className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
