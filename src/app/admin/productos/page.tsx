"use client";

import { useState, useEffect } from "react";
import { Plus, Video, EyeOff, Edit, Trash2, X, Palette, Scaling, Tag, Package, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPrendas, createPrenda, updatePrenda, deletePrenda } from "@/app/actions/productos";
import { uploadImage } from "@/app/actions/upload";
import { getConfiguracion, updateConfiguracion } from "@/app/actions/config";
import { compressImage } from "@/lib/imageCompression";

export default function AdminProductos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCategoriasOpen, setIsModalCategoriasOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [productoABorrar, setProductoABorrar] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados del Formulario
  const [formData, setFormData] = useState({
    nombre: "",
    precioBase: "",
    descuento: "",
    enPromocion: false,
    categoria: "",
    coleccion: "",
    colores: "",
    stockCount: "",
    material: "",
    marca: "",
    isConjunto: false,
    piezasDetalle: {} as any,
    stockPorTalla: {} as any,
    descripcionLarga: "",
    costoProveedor: ""
  });

  const [usarControlFinanciero, setUsarControlFinanciero] = useState(false);

  const [categorias, setCategorias] = useState(["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [isGestionandoCategorias, setIsGestionandoCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [categoriaAEditar, setCategoriaAEditar] = useState<{old: string, new: string} | null>(null);

  const [tallasDisponibles, setTallasDisponibles] = useState(['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Talla Única']);
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
  const [nuevaTalla, setNuevaTalla] = useState("");

  const [fotosPreview, setFotosPreview] = useState<string[]>([]);

  const guardarCategoriasEnBD = async (nuevasCategorias: string[]) => {
    try {
      await updateConfiguracion({ categoriasPrendas: nuevasCategorias });
    } catch (e) {
      console.error("Error al guardar categorías", e);
    }
  };

  const agregarCategoriaLocal = () => {
    const cat = nuevaCategoria.trim();
    if (!cat || categorias.includes(cat)) return;
    const actualizadas = [...categorias, cat];
    setCategorias(actualizadas);
    setNuevaCategoria("");
    guardarCategoriasEnBD(actualizadas);
  };

  const eliminarCategoriaLocal = (cat: string) => {
    const actualizadas = categorias.filter(c => c !== cat);
    setCategorias(actualizadas);
    if (categoriaSeleccionada === cat) setCategoriaSeleccionada("");
    guardarCategoriasEnBD(actualizadas);
  };

  const guardarEdicionCategoriaLocal = () => {
    if (!categoriaAEditar) return;
    const catNuevo = categoriaAEditar.new.trim();
    if (!catNuevo) return;
    const actualizadas = categorias.map(c => c === categoriaAEditar.old ? catNuevo : c);
    setCategorias(actualizadas);
    if (categoriaSeleccionada === categoriaAEditar.old) setCategoriaSeleccionada(catNuevo);
    setCategoriaAEditar(null);
    guardarCategoriasEnBD(actualizadas);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    setIsLoading(true);
    const [resProd, resConf] = await Promise.all([getPrendas(), getConfiguracion()]);
    
    if (resProd.success) {
      setProductos((resProd.data || []).map((p: any) => ({ ...p, originalStock: p.stockCount })));
    }
    
    if (resConf.success && resConf.data && resConf.data.categoriasPrendas) {
      setCategorias(resConf.data.categoriasPrendas);
      setUsarControlFinanciero(resConf.data.usarControlFinanciero ?? true);
    }
    
    setIsLoading(false);
  };

  const abrirModalNueva = () => {
    setProductoEditando(null);
    setFormData({ nombre: "", precioBase: "", descuento: "", enPromocion: false, categoria: "", coleccion: "", colores: "", stockCount: "", material: "", marca: "", isConjunto: false, piezasDetalle: {}, stockPorTalla: {}, descripcionLarga: "", costoProveedor: "" });
    setCategoriaSeleccionada("");
    setTallasSeleccionadas([]);
    setFotosPreview([]);
    setIsModalOpen(true);
  };

  const abrirModalNuevoCombo = () => {
    setProductoEditando(null);
    setFormData({ nombre: "", precioBase: "", descuento: "", enPromocion: false, categoria: "", coleccion: "", colores: "", stockCount: "", material: "", marca: "", isConjunto: true, piezasDetalle: {}, stockPorTalla: {}, descripcionLarga: "", costoProveedor: "" });
    setCategoriaSeleccionada("");
    setTallasSeleccionadas([]);
    setFotosPreview([]);
    setIsModalOpen(true);
  };

  const abrirModalEditar = (producto: any) => {
    setProductoEditando(producto);
    setFormData({
      nombre: producto.nombre || "",
      precioBase: producto.precioOriginal ? producto.precioOriginal.toString() : (producto.precioVenta?.toString() || ""),
      descuento: producto.precioOriginal ? Math.round((1 - (producto.precioVenta / producto.precioOriginal)) * 100).toString() : "",
      enPromocion: producto.precioOriginal ? true : false,
      categoria: producto.categoria || "",
      coleccion: producto.coleccion || "",
      colores: producto.colores?.join(", ") || "",
      stockCount: producto.stockCount?.toString() || "",
      material: producto.material || "",
      marca: producto.marca || "",
      isConjunto: producto.isConjunto || false,
      piezasDetalle: producto.piezasDetalle || {},
      stockPorTalla: producto.stockPorTalla || {},
      descripcionLarga: producto.descripcionLarga || "",
      costoProveedor: producto.costoProveedor?.toString() || ""
    });
    setCategoriaSeleccionada(categorias.includes(producto.categoria) ? producto.categoria : (producto.categoria ? "nueva" : ""));
    if (producto.categoria && !categorias.includes(producto.categoria)) {
      setCategorias([...categorias, producto.categoria]);
      setCategoriaSeleccionada(producto.categoria);
    }
    setTallasSeleccionadas(producto.tallas || []);
    setFotosPreview(producto.imagenes || []);
    setIsModalOpen(true);
  };

  const manejarGuardar = async () => {
    const precioBaseNum = Number(formData.precioBase);
    const descuentoNum = Number(formData.descuento) || 0;
    let precioVentaFinal = precioBaseNum;
    let precioOriginal = null;

    if (formData.enPromocion && descuentoNum > 0) {
      precioOriginal = precioBaseNum;
      precioVentaFinal = precioBaseNum - (precioBaseNum * (descuentoNum / 100));
    }

    // Calcular el stock total basado en la matriz (si no es conjunto) o en la cantidad directa
    let stockTotal = 0;
    let coloresLimpios = formData.colores.split(",").map(c => c.trim()).filter(c => c);

    let stockPorTallaLimpio: any = {};
    if (formData.isConjunto) {
      stockTotal = Number(formData.stockCount) || 0;
    } else if (tallasSeleccionadas.length > 0 && Object.keys(formData.stockPorTalla).length > 0) {
      for (const talla of tallasSeleccionadas) {
        if (typeof formData.stockPorTalla[talla] === 'object') {
          stockPorTallaLimpio[talla] = {};
          for (const color in formData.stockPorTalla[talla]) {
            // Solo contar 'Unico' si no hay colores especificados. Si hay colores, ignorar 'Unico'.
            if ((coloresLimpios.length === 0 && color === 'Unico') || coloresLimpios.includes(color)) {
              stockTotal += Number(formData.stockPorTalla[talla][color]) || 0;
              stockPorTallaLimpio[talla][color] = formData.stockPorTalla[talla][color];
            }
          }
        }
      }
    } else {
      stockTotal = Number(formData.stockCount) || 0;
    }

    const dataAEnviar = {
      nombre: formData.nombre,
      costoProveedor: Number(formData.costoProveedor) || 0,
      precioVenta: precioVentaFinal,
      precioOriginal: precioOriginal,
      categoria: categoriaSeleccionada,
      coleccion: formData.coleccion,
      tallas: tallasSeleccionadas,
      colores: coloresLimpios,
      stockCount: stockTotal,
      stockPorTalla: stockPorTallaLimpio,
      material: formData.material,
      marca: formData.marca,
      isConjunto: formData.isConjunto,
      piezasDetalle: formData.piezasDetalle,
      descripcionLarga: formData.descripcionLarga,
      imagenes: fotosPreview.length > 0 ? fotosPreview : ["https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"], // Placeholder
      enLive: productoEditando ? productoEditando.enLive : true,
      enPreventa: productoEditando ? productoEditando.enPreventa : false
    };

    if (productoEditando) {
      await updatePrenda(productoEditando.id, dataAEnviar);
      mostrarNotificacion("¡Prenda actualizada!");
    } else {
      await createPrenda(dataAEnviar);
      mostrarNotificacion("¡Nueva prenda guardada exitosamente!");
    }
    
    setIsModalOpen(false);
    cargarProductos();
  };

  const handleSubirFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const MAX_FOTOS = 10;
      const filesArray = Array.from(e.target.files).slice(0, MAX_FOTOS - fotosPreview.length);
      
      const uploadedUrls: string[] = [];
      
      for (const file of filesArray) {
        // Comprimir imagen antes de enviarla
        const compressedFile = await compressImage(file);
        
        const formData = new FormData();
        formData.append("file", compressedFile);
        
        try {
          // Reemplazamos la ruta local por la Server Action directa a Supabase Storage
          const res = await uploadImage(formData);
          if (res.success && res.url) {
            uploadedUrls.push(res.url);
          } else {
            console.error("Error al subir:", res.error);
          }
        } catch (error) {
          console.error("Error en la petición de subida:", error);
        }
      }
      
      setFotosPreview(prev => [...prev, ...uploadedUrls].slice(0, MAX_FOTOS));
    }
  };

  const eliminarFotoPreview = (index: number) => {
    setFotosPreview(prev => prev.filter((_, i) => i !== index));
  };

  const toggleLiveBD = async (id: string, currentState: boolean) => {
    setProductos(productos.map(p => p.id === id ? { ...p, enLive: !currentState } : p));
    await updatePrenda(id, { enLive: !currentState });
  };

  const togglePreventaBD = async (id: string, currentState: boolean) => {
    setProductos(productos.map(p => p.id === id ? { ...p, enPreventa: !currentState } : p));
    await updatePrenda(id, { enPreventa: !currentState });
  };

  const confirmarStockBD = async (id: string, newStock: number) => {
    await updatePrenda(id, { stockCount: newStock });
    setProductos(productos.map(p => {
      if (p.id === id) {
        return { ...p, stockCount: newStock, originalStock: newStock };
      }
      return p;
    }));
    mostrarNotificacion("Stock actualizado.");
  };

  const eliminarProducto = async () => {
    if (productoABorrar !== null) {
      await deletePrenda(productoABorrar);
      setProductoABorrar(null);
      cargarProductos();
      mostrarNotificacion("Prenda eliminada definitivamente.");
    }
  };

  const mostrarNotificacion = (mensaje: string) => {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(null), 5000);
  };

  const renderProductoCard = (producto: any) => (
    <motion.div 
      layout
      key={producto.id} 
      className={`glass rounded-3xl overflow-hidden border shadow-3d transition-all ${producto.enLive ? 'border-red-500/50 shadow-red-500/20 ring-2 ring-red-500/20' : 'border-surface-border'}`}
    >
      {/* Imagen del producto */}
      <div className="relative h-48 w-full bg-gray-200">
        <img src={producto.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} alt={producto.nombre} className={`w-full h-full object-cover ${producto.stockCount === 0 ? 'grayscale opacity-50' : ''}`} />
        
        <div className="absolute top-3 left-3 flex gap-2 flex-wrap max-w-[80%]">
          {producto.enLive && (
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span> EN LIVE
            </span>
          )}
          {producto.enPreventa && (
            <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-black tracking-widest shadow-lg flex items-center gap-2">
              PREVENTA
            </span>
          )}
          {producto.stockCount === 0 && !producto.enPreventa && (
            <span className="bg-black/80 text-white px-3 py-1 rounded-full text-xs font-black tracking-widest backdrop-blur-md">
              AGOTADO
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-bold text-lg mb-1 truncate text-foreground">{producto.nombre}</h3>
        <div className="flex justify-between items-center mb-4">
          <p className="text-brand-primary font-black text-xl">Bs. {producto.precioVenta}</p>
          <p className="text-xs font-bold text-foreground/50 bg-surface px-2 py-1 rounded-md">{producto.stockCount} en stock</p>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          {producto.tallas?.length > 0 && (
            <div className="flex items-center gap-1 bg-brand-primary/10 text-brand-primary px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
              <Scaling className="w-3 h-3" /> {producto.tallas.join(", ")}
            </div>
          )}
          {producto.colores?.length > 0 && (
            <div className="flex items-center gap-1 bg-purple-500/10 text-purple-600 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
              <Palette className="w-3 h-3" /> {producto.colores.join(", ")}
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className={`flex-1 flex flex-col items-center justify-center border p-2 rounded-xl transition-colors cursor-pointer shadow-sm ${producto.enLive ? 'bg-red-500/10 border-red-500/30' : 'bg-surface/50 border-surface-border hover:bg-surface-border/80'}`} onClick={() => toggleLiveBD(producto.id, producto.enLive)}>
              <span className={`text-[11px] font-bold mb-1 flex items-center gap-1 ${producto.enLive ? 'text-red-600' : 'text-foreground/60'}`}><Video className="w-3 h-3" /> Destacar LIVE</span>
              <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${producto.enLive ? 'bg-red-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${producto.enLive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <div className={`flex-1 flex flex-col items-center justify-center border p-2 rounded-xl transition-colors cursor-pointer shadow-sm ${producto.enPreventa ? 'bg-purple-500/10 border-purple-500/30' : 'bg-surface/50 border-surface-border hover:bg-surface-border/80'}`} onClick={() => togglePreventaBD(producto.id, producto.enPreventa)}>
              <span className={`text-[11px] font-bold mb-1 ${producto.enPreventa ? 'text-purple-600' : 'text-foreground/60'}`}>Preventa</span>
              <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${producto.enPreventa ? 'bg-purple-500' : 'bg-gray-300'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${producto.enPreventa ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col bg-surface border border-surface-border p-3 rounded-xl gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground flex items-center gap-1"><Package className="w-4 h-4 text-brand-primary"/> Stock Total</span>
                {producto.originalStock !== Number(producto.stockCount) && (
                  <span className="text-[10px] font-bold text-brand-primary animate-pulse">
                    (Antes: {producto.originalStock})
                  </span>
                )}
              </div>
              <div className="flex items-center bg-background border border-surface-border rounded-lg p-0.5 shadow-inner">
                <button 
                  onClick={() => setProductos(productos.map(p => p.id === producto.id ? { ...p, stockCount: Math.max(0, p.stockCount - 1) } : p))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-border rounded-md text-foreground/70 font-black transition-colors"
                >
                  -
                </button>
                <input 
                  type="number"
                  value={producto.stockCount}
                  onChange={(e) => setProductos(productos.map(p => p.id === producto.id ? { ...p, stockCount: Number(e.target.value) } : p))}
                  className="text-sm font-black w-10 text-center text-brand-primary bg-transparent outline-none"
                />
                <button 
                  onClick={() => setProductos(productos.map(p => p.id === producto.id ? { ...p, stockCount: p.stockCount + 1 } : p))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-surface-border rounded-md text-foreground/70 font-black transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            
            <AnimatePresence>
              {producto.originalStock !== Number(producto.stockCount) && (
                <motion.button 
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onClick={() => confirmarStockBD(producto.id, producto.stockCount)}
                  className="w-full bg-brand-primary text-white text-xs font-bold py-2 mt-1 rounded-lg hover:bg-brand-accent transition-colors shadow-md"
                >
                  Guardar nuevo stock
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-surface-border flex justify-between gap-2">
          <button 
            onClick={() => abrirModalEditar(producto)}
            className="flex-1 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition-colors flex justify-center items-center gap-1 text-sm font-bold py-2 rounded-xl"
          >
            <Edit className="w-4 h-4" /> Editar
          </button>
          <button 
            onClick={() => setProductoABorrar(producto.id)}
            className="bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center px-3 rounded-xl"
            title="Borrar prenda"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex-1 p-6 md:p-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Video className="w-8 h-8 text-red-500" /> Catálogo y Live
          </h1>
          <p className="text-foreground/70 mb-4">Gestiona tu inventario real en Supabase.</p>
          
          <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              <strong>Tip de uso:</strong> Desde aquí subes y editas tus prendas. Si estás haciendo un en vivo (Live), activa el switch verde en la tarjeta de cada prenda para separarla y encontrarla más rápido en la parte de arriba.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsModalCategoriasOpen(true)}
            className="w-full sm:w-auto justify-center bg-surface border-2 border-brand-primary text-brand-primary px-4 py-3 rounded-full font-bold shadow hover:bg-brand-primary/10 transition-colors flex items-center gap-2 text-sm md:text-base"
          >
            <Tag className="w-5 h-5 shrink-0" /> Categorías
          </button>
          <button 
            onClick={abrirModalNuevoCombo}
            className="w-full sm:w-auto justify-center bg-yellow-500 text-white px-4 py-3 rounded-full font-bold shadow-xl hover:bg-yellow-600 transition-colors flex items-center gap-2 text-sm md:text-base"
          >
            <Plus className="w-5 h-5 shrink-0" /> Nuevo Combo
          </button>
          <button 
            onClick={abrirModalNueva}
            className="w-full sm:w-auto justify-center bg-brand-primary text-white px-4 py-3 rounded-full font-bold shadow-xl hover:bg-brand-accent transition-colors flex items-center gap-2 text-sm md:text-base"
          >
            <Plus className="w-5 h-5 shrink-0" /> Nueva Prenda
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
        </div>
      ) : productos.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-3xl border border-surface-border">
          <h2 className="text-2xl font-bold text-foreground mb-2">Tu catálogo está vacío</h2>
          <p className="text-foreground/60 mb-6">Añade tu primera prenda para empezar a vender.</p>
          <button onClick={abrirModalNueva} className="bg-brand-primary text-white px-6 py-3 rounded-full font-bold shadow-xl">Añadir Prenda</button>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Sección EN LIVE */}
          {productos.filter(p => p.enLive).length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                <h2 className="text-xl font-bold text-red-600 tracking-widest uppercase">Prendas Seleccionadas para Live</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productos.filter(p => p.enLive).map(renderProductoCard)}
              </div>
            </div>
          )}

          {/* Sección GENERAL */}
          {productos.filter(p => !p.enLive).length > 0 && (
            <div>
              {productos.filter(p => p.enLive).length > 0 && (
                <h2 className="text-sm font-bold tracking-widest uppercase text-foreground/50 mb-6">Catálogo General</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {productos.filter(p => !p.enLive).map(renderProductoCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Agregar / Editar */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div 
              className="bg-background w-full max-w-2xl rounded-3xl overflow-hidden relative z-10 shadow-2xl border border-surface-border flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-surface-border flex justify-between items-center bg-surface/50 shrink-0">
                <h2 className="text-2xl font-black text-foreground">
                  {productoEditando ? `Editar: ${productoEditando.nombre}` : 'Agregar Nueva Prenda'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-surface-border rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto overflow-x-hidden flex-1 space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-brand-primary" /> Fotos de la Prenda
                  </h3>
                  <span className="text-[10px] text-foreground/50 uppercase tracking-widest bg-surface px-2 py-0.5 rounded-full border border-surface-border">Click para subir foto</span>
                </div>  <div className="flex gap-4 flex-wrap">
                    {fotosPreview.length < 10 && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-primary text-brand-primary flex flex-col items-center justify-center hover:bg-brand-primary/10 transition-colors cursor-pointer relative">
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1">Subir</span>
                        <input type="file" multiple accept="image/*" onChange={handleSubirFotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </label>
                    )}
                    {fotosPreview.map((url, i) => (
                      <div key={i} className="w-24 h-24 rounded-2xl bg-surface border border-surface-border relative overflow-hidden group">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-cover" />
                        <button onClick={() => eliminarFotoPreview(i)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="md:col-span-2 lg:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-2">Nombre de la Prenda</label>
                    <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Vestido Gala Rojo" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  {usarControlFinanciero && (
                    <div>
                      <label className="block text-sm font-bold text-red-500 mb-2">Costo Proveedor c/u (Bs.)</label>
                      <input type="number" min="0" value={formData.costoProveedor} onChange={e => setFormData({...formData, costoProveedor: e.target.value})} placeholder="Ej. 120" className="w-full bg-red-500/5 border border-red-500/20 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-700" />
                      {formData.costoProveedor && (
                        <p className="mt-2 text-xs font-bold text-red-600">
                          Inversión Total: Bs. {(Number(formData.costoProveedor) * (Number(formData.stockCount) || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Precio Base (Bs.)</label>
                    <input type="number" min="0" value={formData.precioBase} onChange={e => setFormData({...formData, precioBase: e.target.value})} placeholder="Ej. 200" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  <div className="relative flex flex-col">
                    <label className="block text-sm font-bold text-foreground mb-2">Descuento (%)</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" value={formData.descuento} onChange={e => setFormData({...formData, descuento: e.target.value})} placeholder="Ej. 20" disabled={!formData.enPromocion} className={`flex-1 bg-surface border p-3 rounded-xl focus:ring-2 outline-none transition-colors text-center font-bold ${formData.enPromocion ? 'border-brand-primary focus:ring-brand-primary' : 'border-surface-border opacity-50 cursor-not-allowed'}`} />
                        <span className="text-foreground/50 font-bold text-xs">% OFF</span>
                      </div>
                      <button 
                        onClick={() => setFormData({...formData, enPromocion: !formData.enPromocion})}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border shadow-sm ${
                          formData.enPromocion 
                          ? 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500 hover:text-white'
                          : 'bg-surface border-surface-border text-foreground/50 hover:bg-surface-border/50'
                        }`}
                        title="Activar Oferta"
                      >
                        <Tag className="w-4 h-4 shrink-0" />
                        <span>{formData.enPromocion ? 'OFERTA ACTIVA' : 'ACTIVAR OFERTA'}</span>
                      </button>
                    </div>
                    {formData.enPromocion && formData.precioBase && formData.descuento && (
                      <p className="mt-2 text-xs font-bold text-green-600">
                        Precio final: Bs. {(Number(formData.precioBase) - (Number(formData.precioBase) * (Number(formData.descuento) / 100))).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-sm font-bold text-foreground">Categoría</label>
                      <button 
                        onClick={() => setIsGestionandoCategorias(!isGestionandoCategorias)}
                        className="text-xs text-brand-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> {isGestionandoCategorias ? "Cerrar gestión" : "Gestionar"}
                      </button>
                    </div>

                    {!isGestionandoCategorias ? (
                      <select value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)} className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none">
                        <option value="">Selecciona una categoría...</option>
                        {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    ) : (
                      <div className="bg-surface border border-surface-border p-4 rounded-xl space-y-4">
                        <div className="flex gap-2">
                          <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="flex-1 bg-background border border-surface-border p-2 rounded-lg outline-none text-sm" />
                          <button onClick={agregarCategoriaLocal} className="bg-brand-primary text-background px-4 rounded-lg font-bold text-sm whitespace-nowrap">Añadir</button>
                        </div>
                        <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                          {categorias.map(cat => (
                            <div key={cat} className="flex items-center justify-between bg-background p-2 rounded-lg border border-surface-border text-sm">
                              {categoriaAEditar?.old === cat ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <input 
                                    type="text" 
                                    value={categoriaAEditar.new} 
                                    onChange={(e) => setCategoriaAEditar({...categoriaAEditar, new: e.target.value})} 
                                    className="flex-1 bg-surface border border-brand-primary/50 p-1 rounded outline-none"
                                    autoFocus
                                  />
                                  <button onClick={guardarEdicionCategoriaLocal} className="text-green-500 hover:text-green-600 font-bold px-2">✓</button>
                                  <button onClick={() => setCategoriaAEditar(null)} className="text-gray-400 hover:text-gray-600 font-bold px-2">✕</button>
                                </div>
                              ) : (
                                <>
                                  <span className="font-medium text-foreground">{cat}</span>
                                  <div className="flex gap-2">
                                    <button onClick={() => setCategoriaAEditar({old: cat, new: cat})} className="text-brand-primary hover:text-brand-secondary transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => eliminarCategoriaLocal(cat)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Colección (Opcional)</label>
                    <input type="text" value={formData.coleccion} onChange={e => setFormData({...formData, coleccion: e.target.value})} placeholder="Ej. Verano 2026" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Marca (Opcional)</label>
                    <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} placeholder="Ej. Zara" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Material / Tela (Opcional)</label>
                    <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} placeholder="Ej. Algodón" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Detalles / Descripción Larga (Opcional)</label>
                  <textarea 
                    value={formData.descripcionLarga} 
                    onChange={e => setFormData({...formData, descripcionLarga: e.target.value})} 
                    placeholder="Escribe aquí las medidas exactas, instrucciones de lavado, y cualquier detalle importante que quieras que la clienta vea." 
                    className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none resize-y min-h-[100px]" 
                  />
                </div>

                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-3 mb-6 bg-surface p-4 rounded-xl border border-surface-border cursor-pointer" onClick={() => setFormData({...formData, isConjunto: !formData.isConjunto})}>
                    <input type="checkbox" checked={formData.isConjunto} onChange={() => {}} className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary" />
                    <span className="font-bold text-foreground">¿Es un Conjunto / Combo?</span>
                    <p className="text-xs text-foreground/50 ml-auto">Agrupa múltiples prendas</p>
                  </div>
                  {!formData.isConjunto && (
                    <>
                      <h3 className="font-bold text-brand-primary uppercase tracking-widest text-xs mb-4">Variantes y Stock</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Tallas Disponibles</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tallasDisponibles.map(talla => (
                              <label key={talla} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${tallasSeleccionadas.includes(talla) ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-surface border-surface-border hover:border-brand-primary'}`}>
                                <input 
                                  type="checkbox" 
                                  checked={tallasSeleccionadas.includes(talla)}
                                  onChange={(e) => {
                                    if (e.target.checked) setTallasSeleccionadas([...tallasSeleccionadas, talla]);
                                    else setTallasSeleccionadas(tallasSeleccionadas.filter(t => t !== talla));
                                  }}
                                  className="hidden" 
                                />
                                <span className="text-sm font-bold">{talla}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Colores (Separar con coma)</label>
                          <input type="text" value={formData.colores} onChange={e => setFormData({...formData, colores: e.target.value})} placeholder="Ej. Rojo, Negro" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                        </div>
                      </div>

                      {tallasSeleccionadas.length > 0 ? (
                        <div className="bg-background rounded-xl border border-surface-border p-4 overflow-x-auto shadow-sm">
                          <label className="block text-sm font-bold text-foreground mb-4">
                            {formData.colores.split(",").filter(c => c.trim()).length > 0 
                              ? "Inventario Exacto por Talla y Color" 
                              : "Inventario Exacto por Talla (Color Opcional)"}
                          </label>
                          <table className="w-full text-left text-sm">
                            <thead>
                              <tr>
                                <th className="pb-2 border-b border-surface-border font-black text-brand-primary">Talla</th>
                                {formData.colores.split(",").filter(c => c.trim()).length > 0 ? (
                                  formData.colores.split(",").map(c => c.trim()).filter(c => c).map(color => (
                                    <th key={color} className="pb-2 border-b border-surface-border font-bold uppercase text-xs tracking-wider">{color}</th>
                                  ))
                                ) : (
                                  <th className="pb-2 border-b border-surface-border font-bold uppercase text-xs tracking-wider">Cantidad</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {tallasSeleccionadas.map(talla => (
                                <tr key={talla}>
                                  <td className="py-3 font-bold border-b border-surface-border/50">{talla}</td>
                                  {formData.colores.split(",").filter(c => c.trim()).length > 0 ? (
                                    formData.colores.split(",").map(c => c.trim()).filter(c => c).map(color => (
                                      <td key={color} className="py-2 pr-2 border-b border-surface-border/50">
                                        <input 
                                          type="number" min="0" 
                                          value={formData.stockPorTalla?.[talla]?.[color] || ""}
                                          onChange={(e) => {
                                            const val = Math.max(0, Number(e.target.value));
                                            setFormData({
                                              ...formData,
                                              stockPorTalla: {
                                                ...formData.stockPorTalla,
                                                [talla]: {
                                                  ...(formData.stockPorTalla[talla] || {}),
                                                  [color]: val.toString()
                                                }
                                              }
                                            });
                                          }}
                                          className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary font-mono text-center" 
                                          placeholder="0"
                                        />
                                      </td>
                                    ))
                                  ) : (
                                    <td className="py-2 pr-2 border-b border-surface-border/50">
                                      <input 
                                        type="number" min="0" 
                                        value={formData.stockPorTalla?.[talla]?.['Unico'] || ""}
                                        onChange={(e) => {
                                          const val = Math.max(0, Number(e.target.value));
                                          setFormData({
                                            ...formData,
                                            stockPorTalla: {
                                              ...formData.stockPorTalla,
                                              [talla]: {
                                                ...(formData.stockPorTalla[talla] || {}),
                                                ['Unico']: val.toString()
                                              }
                                            }
                                          });
                                        }}
                                        className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary font-mono text-center" 
                                        placeholder="0"
                                      />
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                          <label className="block text-sm font-bold text-yellow-700 dark:text-yellow-500 mb-2">Cantidad de Stock General</label>
                          <p className="text-xs text-foreground/60 mb-3">Selecciona tallas para llevar un inventario exacto. De lo contrario, usa este stock general.</p>
                          <input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} placeholder="Ej. 12" className="w-full max-w-xs bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" />
                        </div>
                      )}
                    </>
                  )}
                  {formData.isConjunto && (
                    <div className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-xl space-y-6">
                      
                      <div>
                        <h3 className="font-bold text-foreground text-base mb-2">Cantidad de Combos en Stock</h3>
                        <p className="text-xs text-foreground/60 mb-2">¿Cuántos de estos conjuntos vas a armar y poner a la venta?</p>
                        <input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} placeholder="Ej. 5" className="w-full max-w-xs bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                      </div>

                      <div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                          <div>
                            <h3 className="font-bold text-foreground text-base mb-1">Piezas del Conjunto</h3>
                            <p className="text-xs text-foreground/70">Añade las prendas y selecciona la talla/color exacto de cada una.</p>
                          </div>
                          <div className="bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center shadow-sm">
                            Suma de piezas: Bs. {Object.keys(formData.piezasDetalle || {}).reduce((acc, id) => {
                               const prod = productos.find(p => p.id === id);
                               return acc + (prod?.precioVenta || 0) * (formData.piezasDetalle[id].cantidad || 0);
                             }, 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                          {productos.filter(p => !p.isConjunto).map(prod => {
                            const seleccionado = formData.piezasDetalle?.[prod.id];
                            return (
                              <div key={prod.id} className={`p-3 bg-surface border rounded-lg transition-colors ${seleccionado ? 'border-brand-primary bg-brand-primary/5' : 'border-surface-border'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img src={prod.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} alt={prod.nombre} className="w-10 h-10 rounded object-cover shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold truncate w-full">{prod.nombre}</p>
                                      <p className="text-xs text-foreground/50">Stock suelto: {prod.stockCount}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between border-t sm:border-0 pt-2 sm:pt-0 border-brand-primary/10 gap-2 shrink-0">
                                    <span className="text-[10px] uppercase font-black tracking-wider text-brand-primary">Unds/Combo</span>
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => {
                                        const curr = seleccionado?.cantidad || 0;
                                        if (curr > 0) {
                                          const newDet = { ...formData.piezasDetalle };
                                          if (curr === 1) {
                                            delete newDet[prod.id];
                                            setFormData({...formData, piezasDetalle: newDet});
                                          } else {
                                            newDet[prod.id] = { ...newDet[prod.id], cantidad: curr - 1 };
                                            setFormData({...formData, piezasDetalle: newDet});
                                          }
                                        }
                                      }} className="w-6 h-6 flex items-center justify-center bg-background border border-surface-border rounded font-bold hover:bg-surface-border transition-colors">-</button>
                                      <span className="text-sm font-bold w-6 text-center">{seleccionado?.cantidad || 0}</span>
                                      <button onClick={() => {
                                        const newDet = { ...formData.piezasDetalle };
                                        newDet[prod.id] = { 
                                          id: prod.id, 
                                          cantidad: (newDet[prod.id]?.cantidad || 0) + 1, 
                                          tallaEspecifica: newDet[prod.id]?.tallaEspecifica || "",
                                          colorEspecifico: newDet[prod.id]?.colorEspecifico || "",
                                          tallas: prod.tallas, colores: prod.colores, material: prod.material 
                                        };
                                        setFormData({...formData, piezasDetalle: newDet});
                                      }} className="w-6 h-6 flex items-center justify-center bg-brand-primary text-white rounded font-bold hover:brightness-110 transition-colors">+</button>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Opciones Específicas si está seleccionado */}
                                {seleccionado && (prod.tallas?.length > 0 || prod.colores?.length > 0) && (
                                 <div className="mt-3 pt-3 border-t border-brand-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {prod.tallas?.length > 0 && (
                                      <div>
                                        <label className="text-xs font-bold text-foreground mb-1 block">Talla en el Combo</label>
                                        <select 
                                          value={seleccionado.tallaEspecifica || ""}
                                          onChange={(e) => {
                                            const newDet = { ...formData.piezasDetalle };
                                            newDet[prod.id].tallaEspecifica = e.target.value;
                                            setFormData({...formData, piezasDetalle: newDet});
                                          }}
                                          className="w-full text-xs p-2 rounded border border-brand-primary/30 outline-none focus:border-brand-primary bg-background"
                                        >
                                          <option value="">Selecciona Talla</option>
                                          {prod.tallas.map((t:string) => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                      </div>
                                    )}
                                    {prod.colores?.length > 0 && (
                                      <div>
                                        <label className="text-xs font-bold text-foreground mb-1 block">Color en el Combo</label>
                                        <select 
                                          value={seleccionado.colorEspecifico || ""}
                                          onChange={(e) => {
                                            const newDet = { ...formData.piezasDetalle };
                                            newDet[prod.id].colorEspecifico = e.target.value;
                                            setFormData({...formData, piezasDetalle: newDet});
                                          }}
                                          className="w-full text-xs p-2 rounded border border-brand-primary/30 outline-none focus:border-brand-primary bg-background"
                                        >
                                          <option value="">Selecciona Color</option>
                                          {prod.colores.map((c:string) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-surface-border bg-surface/50 flex justify-end gap-4 shrink-0">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-full font-bold text-foreground/70 hover:bg-surface-border transition-colors">Cancelar</button>
                <button onClick={manejarGuardar} className="bg-brand-primary text-background px-8 py-3 rounded-full font-bold shadow-lg hover:brightness-90 transition-all">
                  {productoEditando ? 'Actualizar Prenda' : 'Guardar Prenda'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {productoABorrar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-surface border border-surface-border p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center relative z-[61]">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">¿Borrar prenda?</h3>
              <p className="text-foreground/70 mb-6 text-sm">Esta acción eliminará el producto del catálogo y no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setProductoABorrar(null)} className="flex-1 px-4 py-3 bg-surface-border text-foreground font-bold rounded-xl hover:bg-surface-border/80 transition-colors">Cancelar</button>
                <button onClick={eliminarProducto} className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Sí, borrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notificacion && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-24 md:bottom-6 right-6 bg-surface border border-brand-primary shadow-2xl rounded-xl p-4 flex items-center gap-3 z-[70] max-w-md">
            <div className="bg-brand-primary/20 p-2 rounded-full"><span className="text-brand-primary font-black">!</span></div>
            <p className="text-sm font-bold text-foreground">{notificacion}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL GESTION CATEGORIAS GENERAL */}
      {isModalCategoriasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">Gestionar Categorías</h3>
              <button onClick={() => setIsModalCategoriasOpen(false)} className="text-foreground/50 hover:bg-surface-border p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Nueva categoría..." value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)} className="flex-1 bg-background border border-surface-border p-3 rounded-xl outline-none" />
              <button onClick={agregarCategoriaLocal} className="bg-brand-primary text-background px-6 rounded-xl font-bold hover:brightness-110">Añadir</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar bg-background p-2 rounded-xl border border-surface-border">
              {categorias.map(cat => (
                <div key={cat} className="flex items-center justify-between bg-surface p-3 rounded-lg border border-surface-border shadow-sm">
                  {categoriaAEditar?.old === cat ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input 
                        type="text" 
                        value={categoriaAEditar.new} 
                        onChange={(e) => setCategoriaAEditar({...categoriaAEditar, new: e.target.value})} 
                        className="flex-1 bg-background border border-brand-primary p-2 rounded-lg outline-none font-bold"
                        autoFocus
                      />
                      <button onClick={guardarEdicionCategoriaLocal} className="bg-green-100 text-green-600 rounded-lg font-bold p-2"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setCategoriaAEditar(null)} className="bg-gray-100 text-gray-500 rounded-lg font-bold p-2"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-foreground">{cat}</span>
                      <div className="flex gap-2">
                        <button onClick={() => setCategoriaAEditar({old: cat, new: cat})} className="p-2 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => eliminarCategoriaLocal(cat)} className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {categorias.length === 0 && (
                <div className="text-center p-4 text-foreground/50">No hay categorías.</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
