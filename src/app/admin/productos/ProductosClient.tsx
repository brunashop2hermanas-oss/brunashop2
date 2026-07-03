"use client";

import { useState, useEffect } from "react";
import { Plus, Video, Eye, EyeOff, Edit, Trash2, X, Palette, Scaling, Tag, Package, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPrendas, createPrenda, updatePrenda, deletePrenda, toggleVisibilidadPrenda } from "@/app/actions/productos";
import { uploadImage } from "@/app/actions/upload";
import { getConfiguracion, updateConfiguracion } from "@/app/actions/config";
import { compressImage } from "@/lib/imageCompression";
import ImageCropperModal from '@/components/ImageCropperModal';

export default function AdminProductos() {
  const [productos, setProductos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalCategoriasOpen, setIsModalCategoriasOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<any>(null);
  const [productoABorrar, setProductoABorrar] = useState<string | null>(null);
  const [tallaEditando, setTallaEditando] = useState<{ old: string, new: string } | null>(null);
  const [tallaABorrar, setTallaABorrar] = useState<string | null>(null);
  const [notificacion, setNotificacion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imagenAmpliada, setImagenAmpliada] = useState<string | null>(null);

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
    nuevoStockPorTalla: {} as any,
    imagenesPorColor: {} as any,
    descripcionLarga: "",
    costoProveedor: "",
    visiblePublico: false
  });

  const [usarControlFinanciero, setUsarControlFinanciero] = useState(false);
  const [filtroVisibilidad, setFiltroVisibilidad] = useState<"Todas" | "En Live" | "Publicas" | "Ocultas">("Todas");
  const [ordenamiento, setOrdenamiento] = useState<"fecha_desc" | "fecha_asc" | "mod_desc" | "mod_asc" | "nombre_asc" | "nombre_desc" | "stock_asc" | "stock_desc">("fecha_desc");
  const [visibleCount, setVisibleCount] = useState(12);

  const cargarMas = () => setVisibleCount(prev => prev + 12);

  // Reset pagination when filter changes
  useEffect(() => {
    setVisibleCount(12);
  }, [filtroVisibilidad, ordenamiento]);

  const [categorias, setCategorias] = useState(["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [isGestionandoCategorias, setIsGestionandoCategorias] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [categoriaAEditar, setCategoriaAEditar] = useState<{ old: string, new: string } | null>(null);

  const TALLAS_BASE = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Talla Única'];
  const [tallasDisponibles, setTallasDisponibles] = useState(TALLAS_BASE);
  const [tallasSeleccionadas, setTallasSeleccionadas] = useState<string[]>([]);
  const [nuevaTalla, setNuevaTalla] = useState("");

  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  
  const [imagesQueue, setImagesQueue] = useState<File[]>([]);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (imagesQueue.length > 0 && !imageToCrop) {
      const nextFile = imagesQueue[0];
      const objectUrl = URL.createObjectURL(nextFile);
      setImageToCrop(objectUrl);
    }
  }, [imagesQueue, imageToCrop]);

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
    setFormData({ nombre: "", precioBase: "", descuento: "", enPromocion: false, categoria: "", coleccion: "", colores: "", stockCount: "", material: "", marca: "", isConjunto: false, piezasDetalle: {}, stockPorTalla: {}, nuevoStockPorTalla: {}, imagenesPorColor: {}, descripcionLarga: "", costoProveedor: "", visiblePublico: false });
    setCategoriaSeleccionada("");
    setTallasDisponibles(TALLAS_BASE);
    setTallasSeleccionadas([]);
    setFotosPreview([]);
    setIsModalOpen(true);
  };

  const abrirModalNuevoCombo = () => {
    setProductoEditando(null);
    setFormData({ nombre: "", precioBase: "", descuento: "", enPromocion: false, categoria: "", coleccion: "", colores: "", stockCount: "", material: "", marca: "", isConjunto: true, piezasDetalle: {}, stockPorTalla: {}, nuevoStockPorTalla: {}, imagenesPorColor: {}, descripcionLarga: "", costoProveedor: "", visiblePublico: false });
    setCategoriaSeleccionada("");
    setTallasDisponibles(TALLAS_BASE);
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
      stockPorTalla: (() => {
        let s: Record<string, any> = {};
        if (producto.stockPorTalla) {
          const stock = producto.stockPorTalla as Record<string, any>;
          Object.keys(stock).forEach(talla => {
            if (typeof stock[talla] === 'object' && stock[talla] !== null) {
              s[talla] = { ...stock[talla] };
            } else {
              s[talla] = { 'Unico': String(stock[talla]) };
            }
          });
        }
        return s;
      })(),
      nuevoStockPorTalla: {},
      imagenesPorColor: producto.imagenesPorColor || {},
      descripcionLarga: producto.descripcionLarga || "",
      costoProveedor: producto.costoProveedor?.toString() || "",
      visiblePublico: producto.visiblePublico !== false
    });
    setCategoriaSeleccionada(categorias.includes(producto.categoria) ? producto.categoria : (producto.categoria ? "nueva" : ""));
    if (producto.categoria && !categorias.includes(producto.categoria)) {
      setCategorias([...categorias, producto.categoria]);
      setCategoriaSeleccionada(producto.categoria);
    }
    const tallasProducto: string[] = producto.tallas || [];
    const tallasExtras = tallasProducto.filter((t: string) => !TALLAS_BASE.includes(t));
    setTallasDisponibles([...TALLAS_BASE, ...tallasExtras]);
    setTallasSeleccionadas(tallasProducto);
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
    if (tallasSeleccionadas.length > 0) {
      for (const talla of tallasSeleccionadas) {
        if (typeof formData.stockPorTalla[talla] === 'object') {
          stockPorTallaLimpio[talla] = {};
          for (const color in formData.stockPorTalla[talla]) {
            // Solo contar 'Unico' si no hay colores especificados. Si hay colores, ignorar 'Unico'.
            if ((coloresLimpios.length === 0 && color === 'Unico') || coloresLimpios.includes(color)) {
              const currentStock = Number(formData.stockPorTalla[talla][color]) || 0;
              const addedStock = Number(formData.nuevoStockPorTalla?.[talla]?.[color]) || 0;
              const finalStock = currentStock + addedStock;
              stockTotal += finalStock;
              stockPorTallaLimpio[talla][color] = finalStock.toString();
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
      imagenesPorColor: formData.imagenesPorColor,
      enLive: productoEditando ? productoEditando.enLive : false,
      enPreventa: productoEditando ? productoEditando.enPreventa : false,
      visiblePublico: formData.visiblePublico
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

  const handleSubirFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const MAX_FOTOS = 10;
      const filesArray = Array.from(e.target.files).slice(0, MAX_FOTOS - fotosPreview.length);
      setImagesQueue(prev => [...prev, ...filesArray]);
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    const croppedFile = new File([croppedBlob], "cropped.jpg", { type: "image/jpeg" });
    const compressedFile = await compressImage(croppedFile);
    
    const formData = new FormData();
    formData.append("file", compressedFile);

    try {
      const res = await uploadImage(formData);
      if (res.success && res.url) {
        if (editingImageIndex !== null) {
          setFotosPreview(prev => {
            const newFotos = [...prev];
            newFotos[editingImageIndex] = res.url!;
            return newFotos;
          });
          setEditingImageIndex(null);
        } else {
          setFotosPreview(prev => [...prev, res.url!]);
          setImagesQueue(prev => prev.slice(1));
        }
      } else {
        console.error("Error al subir:", res.error);
        if (editingImageIndex === null) setImagesQueue(prev => prev.slice(1));
      }
    } catch (error) {
      console.error("Error en la petición de subida:", error);
      if (editingImageIndex === null) setImagesQueue(prev => prev.slice(1));
    }
    
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    if (editingImageIndex !== null) {
      setEditingImageIndex(null);
    } else {
      setImagesQueue(prev => prev.slice(1));
    }
  };

  const handleEditCrop = (index: number) => {
    setEditingImageIndex(index);
    setImageToCrop(fotosPreview[index]);
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

  const toggleVisibilidadBD = async (id: string, currentState: boolean) => {
    const newState = !currentState;
    setProductos(productos.map(p => p.id === id ? { ...p, visiblePublico: newState } : p));
    const res = await toggleVisibilidadPrenda(id, newState);
    if (!res.success) {
      mostrarNotificacion("Error: " + res.error);
      setProductos(productos.map(p => p.id === id ? { ...p, visiblePublico: currentState } : p));
    } else {
      mostrarNotificacion(newState ? "Prenda PÚBLICA" : "Prenda OCULTA");
    }
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
      <div className="relative aspect-[4/5] w-full bg-gray-50 flex items-center justify-center">
        <img src={producto.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} alt={producto.nombre} className={`w-full h-full object-cover object-top ${producto.stockCount === 0 ? 'grayscale opacity-50' : ''}`} />

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

            <div className={`flex-1 flex flex-col items-center justify-center border p-2 rounded-xl transition-colors cursor-pointer shadow-sm ${producto.visiblePublico === false ? 'bg-gray-500/10 border-gray-500/30' : 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20'}`} onClick={() => toggleVisibilidadBD(producto.id, producto.visiblePublico !== false)}>
              <span className={`text-[11px] font-bold mb-1 flex items-center gap-1 ${producto.visiblePublico === false ? 'text-gray-600' : 'text-green-600'}`}>
                {producto.visiblePublico === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {producto.visiblePublico === false ? 'OCULTO' : 'PÚBLICO'}
              </span>
              <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${producto.visiblePublico === false ? 'bg-gray-400' : 'bg-green-500'}`}>
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${producto.visiblePublico === false ? 'translate-x-1' : 'translate-x-5'}`} />
              </button>
            </div>
          </div>

          <div className="flex flex-col bg-surface border border-surface-border p-3 rounded-xl gap-2 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground flex items-center gap-1"><Package className="w-4 h-4 text-brand-primary" /> Stock Total</span>
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
      {/* Encabezado */}
      <div className="mb-6 max-w-4xl">
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <Video className="w-8 h-8 text-red-500" /> Catálogo y Live
          </h1>
          <p className="text-foreground/70 mb-4">Gestiona tu inventario real.</p>

          <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <span className="text-xl shrink-0">💡</span>
            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
              <strong>Tip de uso:</strong> Desde aquí subes y editas tus prendas. Si estás haciendo un en vivo (Live), activa el switch verde en la tarjeta de cada prenda para separarla y encontrarla más rápido en la parte de arriba.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full mb-8">
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-surface-border pb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
          <button onClick={() => setFiltroVisibilidad("Todas")} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filtroVisibilidad === "Todas" ? 'bg-brand-primary text-white shadow-md' : 'bg-surface text-foreground/70 hover:bg-surface-border'}`}>
            Todas
          </button>
          <button onClick={() => setFiltroVisibilidad("En Live")} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filtroVisibilidad === "En Live" ? 'bg-red-500 text-white shadow-md' : 'bg-surface text-foreground/70 hover:bg-surface-border'}`}>
            <Video className="w-4 h-4" /> En Live
          </button>
          <button onClick={() => setFiltroVisibilidad("Publicas")} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filtroVisibilidad === "Publicas" ? 'bg-green-500 text-white shadow-md' : 'bg-surface text-foreground/70 hover:bg-surface-border'}`}>
            <Eye className="w-4 h-4" /> Públicas
          </button>
          <button onClick={() => setFiltroVisibilidad("Ocultas")} className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${filtroVisibilidad === "Ocultas" ? 'bg-gray-500 text-white shadow-md' : 'bg-surface text-foreground/70 hover:bg-surface-border'}`}>
            <EyeOff className="w-4 h-4" /> Ocultas
          </button>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold text-foreground/70">Ordenar:</span>
          <select
            value={ordenamiento}
            onChange={(e) => setOrdenamiento(e.target.value as any)}
            className="bg-surface border border-surface-border rounded-xl px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            <option value="fecha_desc">Más recientes</option>
            <option value="fecha_asc">Más antiguas</option>
            <option value="mod_desc">Modificación (Desc)</option>
            <option value="mod_asc">Modificación (Asc)</option>
            <option value="nombre_asc">Nombre (A-Z)</option>
            <option value="nombre_desc">Nombre (Z-A)</option>
            <option value="stock_asc">Menor Stock</option>
            <option value="stock_desc">Mayor Stock</option>
          </select>
        </div>
      </div>

      {(() => {
        let productosAVisualizar = productos.filter(p => {
          if (filtroVisibilidad === "En Live") return p.enLive;
          if (filtroVisibilidad === "Publicas") return p.visiblePublico !== false;
          if (filtroVisibilidad === "Ocultas") return p.visiblePublico === false;
          return true;
        });

        productosAVisualizar = productosAVisualizar.sort((a, b) => {
          switch (ordenamiento) {
            case "fecha_asc": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "mod_desc": return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
            case "mod_asc": return new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime();
            case "nombre_asc": return a.nombre.localeCompare(b.nombre);
            case "nombre_desc": return b.nombre.localeCompare(a.nombre);
            case "stock_asc": return a.stockCount - b.stockCount;
            case "stock_desc": return b.stockCount - a.stockCount;
            case "fecha_desc":
            default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
        });

        if (isLoading) {
          return (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex gap-4 p-4 bg-surface rounded-2xl border border-surface-border">
                  <div className="w-24 h-32 bg-surface-border/50 animate-pulse rounded-xl"></div>
                  <div className="flex-1 space-y-4 py-2">
                    <div className="h-6 w-1/3 bg-surface-border/50 animate-pulse rounded"></div>
                    <div className="h-4 w-1/4 bg-surface-border/50 animate-pulse rounded"></div>
                    <div className="h-10 w-full bg-surface-border/50 animate-pulse rounded-xl mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          );
        }

        if (productosAVisualizar.length === 0) {
          return (
            <div className="text-center py-20 bg-surface rounded-3xl border border-surface-border">
              <h2 className="text-2xl font-bold text-foreground mb-2">No hay prendas que mostrar</h2>
              <p className="text-foreground/60 mb-6">No hay prendas que coincidan con tu filtro actual.</p>
              <button onClick={abrirModalNueva} className="bg-brand-primary text-white px-6 py-3 rounded-full font-bold shadow-xl">Añadir Prenda</button>
            </div>
          );
        }

        const productosPaginados = productosAVisualizar.slice(0, visibleCount);

        return (
          <div className="space-y-12">
            {/* Sección EN LIVE */}
            {productosPaginados.filter(p => p.enLive).length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  <h2 className="text-xl font-bold text-red-600 tracking-widest uppercase">Prendas Seleccionadas para Live</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productosPaginados.filter(p => p.enLive).map(renderProductoCard)}
                </div>
              </div>
            )}

            {/* Sección GENERAL */}
            {productosPaginados.filter(p => !p.enLive).length > 0 && (
              <div>
                {productosPaginados.filter(p => p.enLive).length > 0 && (
                  <h2 className="text-sm font-bold tracking-widest uppercase text-foreground/50 mb-6">Catálogo General</h2>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {productosPaginados.filter(p => !p.enLive).map(renderProductoCard)}
                </div>
              </div>
            )}

            {/* Botón Cargar Más */}
            {visibleCount < productosAVisualizar.length && (
              <div className="flex justify-center mt-8 pb-12">
                <button
                  onClick={cargarMas}
                  className="bg-surface hover:bg-surface-border text-foreground border border-surface-border px-8 py-3 rounded-full font-bold shadow-sm transition-colors"
                >
                  Cargar más prendas ({productosAVisualizar.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        );
      })()}

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
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {fotosPreview.length < 10 && (
                      <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-brand-primary text-brand-primary flex flex-col items-center justify-center hover:bg-brand-primary/10 transition-colors cursor-pointer relative">
                        <Plus className="w-6 h-6" />
                        <span className="text-[10px] font-bold mt-1">Subir</span>
                        <input type="file" multiple accept="image/*" onChange={handleSubirFotos} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </label>
                    )}
                    {fotosPreview.map((url, i) => (
                      <div key={i} className="w-24 h-24 rounded-2xl bg-surface border border-surface-border relative overflow-hidden group">
                        <img src={url} alt={`Preview ${i}`} className="w-full h-full object-contain bg-slate-50" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                          <button onClick={() => handleEditCrop(i)} className="bg-brand-primary text-white p-1.5 rounded-full hover:scale-110 transition-transform" title="Editar recorte">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => eliminarFotoPreview(i)} className="bg-red-500 text-white p-1.5 rounded-full hover:scale-110 transition-transform" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="md:col-span-2 lg:col-span-2">
                    <label className="block text-sm font-bold text-foreground mb-2">Nombre de la Prenda</label>
                    <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej. Vestido Gala Rojo" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  {usarControlFinanciero && (
                    <div>
                      <label className="block text-sm font-bold text-red-500 mb-2">Costo Proveedor c/u (Bs.)</label>
                      <input type="number" min="0" value={formData.costoProveedor} onChange={e => setFormData({ ...formData, costoProveedor: e.target.value })} placeholder="Ej. 120" className="w-full bg-red-500/5 border border-red-500/20 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-red-700" />
                      {formData.costoProveedor && (
                        <p className="mt-2 text-xs font-bold text-red-600">
                          Inversión Total: Bs. {(Number(formData.costoProveedor) * (Number(formData.stockCount) || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Precio Base (Bs.)</label>
                    <input type="number" min="0" value={formData.precioBase} onChange={e => setFormData({ ...formData, precioBase: e.target.value })} placeholder="Ej. 200" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  <div className="relative flex flex-col">
                    <label className="block text-sm font-bold text-foreground mb-2">Descuento (%)</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input type="number" min="0" max="100" value={formData.descuento} onChange={e => setFormData({ ...formData, descuento: e.target.value })} placeholder="Ej. 20" disabled={!formData.enPromocion} className={`flex-1 bg-surface border p-3 rounded-xl focus:ring-2 outline-none transition-colors text-center font-bold ${formData.enPromocion ? 'border-brand-primary focus:ring-brand-primary' : 'border-surface-border opacity-50 cursor-not-allowed'}`} />
                        <span className="text-foreground/50 font-bold text-xs">% OFF</span>
                      </div>
                      <button
                        onClick={() => setFormData({ ...formData, enPromocion: !formData.enPromocion })}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 border shadow-sm ${formData.enPromocion
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
                                    onChange={(e) => setCategoriaAEditar({ ...categoriaAEditar, new: e.target.value })}
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
                                    <button onClick={() => setCategoriaAEditar({ old: cat, new: cat })} className="text-brand-primary hover:text-brand-secondary transition-colors" title="Editar"><Edit className="w-4 h-4" /></button>
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
                    <input type="text" value={formData.coleccion} onChange={e => setFormData({ ...formData, coleccion: e.target.value })} placeholder="Ej. Verano 2026" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Marca (Opcional)</label>
                    <input type="text" value={formData.marca} onChange={e => setFormData({ ...formData, marca: e.target.value })} placeholder="Ej. Zara" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2">Material / Tela (Opcional)</label>
                    <input type="text" value={formData.material} onChange={e => setFormData({ ...formData, material: e.target.value })} placeholder="Ej. Algodón" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Detalles / Descripción Larga (Opcional)</label>
                  <textarea
                    value={formData.descripcionLarga}
                    onChange={e => setFormData({ ...formData, descripcionLarga: e.target.value })}
                    placeholder="Escribe aquí las medidas exactas, instrucciones de lavado, y cualquier detalle importante que quieras que la clienta vea."
                    className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none resize-y min-h-[100px]"
                  />
                </div>

                <div className="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl p-5 space-y-5">
                  <div className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-surface-border cursor-pointer" onClick={() => setFormData({ ...formData, visiblePublico: !formData.visiblePublico })}>
                    <input type="checkbox" checked={formData.visiblePublico} onChange={() => { }} className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary" />
                    <span className="font-bold text-foreground flex items-center gap-2">
                      {formData.visiblePublico ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                      {formData.visiblePublico ? 'Visible en Tienda Pública' : 'Oculto (Solo Admins)'}
                    </span>
                    <p className="text-xs text-foreground/50 ml-auto hidden sm:block">Controla si los clientes pueden verla</p>
                  </div>

                  {!productoEditando && (
                    <div className="flex items-center gap-3 mb-6 bg-surface p-4 rounded-xl border border-surface-border cursor-pointer" onClick={() => setFormData({ ...formData, isConjunto: !formData.isConjunto })}>
                      <input type="checkbox" checked={formData.isConjunto} onChange={() => { }} className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary" />
                      <span className="font-bold text-foreground">¿Es un Conjunto / Combo?</span>
                      <p className="text-xs text-foreground/50 ml-auto">Agrupa múltiples prendas</p>
                    </div>
                  )}
                  {!formData.isConjunto && (
                    <>
                      <h3 className="font-bold text-brand-primary uppercase tracking-widest text-xs mb-4">Variantes y Stock</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Tallas Disponibles</label>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tallasDisponibles.map(talla => {
                              const esPersonalizada = !TALLAS_BASE.includes(talla);
                              return (
                                <label key={talla} className={`flex items-center gap-1 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${tallasSeleccionadas.includes(talla) ? 'bg-brand-primary/10 border-brand-primary text-brand-primary' : 'bg-surface border-surface-border hover:border-brand-primary'}`}>
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
                                  {esPersonalizada && (
                                    <div className="ml-1 pl-1 border-l border-foreground/10 flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                      <span
                                        role="button"
                                        title={`Editar talla ${talla}`}
                                        className="text-xs hover:text-blue-500 transition-colors p-0.5"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setTallaEditando({ old: talla, new: talla }); return;
                                        }}
                                      >
                                        <Edit className="w-3 h-3" />
                                      </span>
                                      <span
                                        role="button"
                                        title={`Eliminar talla ${talla}`}
                                        className="text-xs hover:text-red-500 transition-colors p-0.5"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setTallaABorrar(talla); return;
                                          if (false) {
                                            setTallasDisponibles(tallasDisponibles.filter(t => t !== talla));
                                            setTallasSeleccionadas(tallasSeleccionadas.filter(t => t !== talla));

                                            // Limpiar el stockPorTalla
                                            const newStockPorTalla = { ...formData.stockPorTalla };
                                            delete newStockPorTalla[talla];
                                            setFormData({ ...formData, stockPorTalla: newStockPorTalla });
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </span>
                                    </div>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 mb-3">
                            <input
                              type="text"
                              value={nuevaTalla}
                              onChange={e => setNuevaTalla(e.target.value)}
                              placeholder="Nueva talla (Ej. S/M)"
                              className="bg-surface border border-surface-border p-2 rounded-lg focus:ring-2 focus:ring-brand-primary outline-none flex-1 text-sm"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (nuevaTalla.trim() && !tallasDisponibles.includes(nuevaTalla.trim().toUpperCase())) {
                                    setTallasDisponibles([...tallasDisponibles, nuevaTalla.trim().toUpperCase()]);
                                    setTallasSeleccionadas([...tallasSeleccionadas, nuevaTalla.trim().toUpperCase()]);
                                    setNuevaTalla("");
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (nuevaTalla.trim() && !tallasDisponibles.includes(nuevaTalla.trim().toUpperCase())) {
                                  setTallasDisponibles([...tallasDisponibles, nuevaTalla.trim().toUpperCase()]);
                                  setTallasSeleccionadas([...tallasSeleccionadas, nuevaTalla.trim().toUpperCase()]);
                                  setNuevaTalla("");
                                }
                              }}
                              className="bg-brand-primary text-white px-3 py-2 rounded-lg font-bold text-sm hover:bg-brand-primary/90 flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-foreground mb-2">Colores (Separar con coma)</label>
                          <input type="text" value={formData.colores} onChange={e => setFormData({ ...formData, colores: e.target.value })} placeholder="Ej. Rojo, Negro" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                        </div>
                      </div>

                      {formData.colores.trim().length > 0 && fotosPreview.length > 1 && (
                        <div className="bg-surface border border-surface-border p-4 rounded-xl shadow-sm mb-6">
                          <label className="block text-sm font-bold text-foreground mb-2">
                            <ImageIcon className="w-4 h-4 text-brand-primary inline mr-2" />
                            Asignar foto a cada color (Opcional)
                          </label>
                          <p className="text-xs text-foreground/60 mb-4">Selecciona la imagen que corresponde a cada color. Haz click en la lupa para ampliarla en otra pestaña.</p>
                          <div className="flex flex-col gap-4">
                            {formData.colores.split(",").map(c => c.trim()).filter(c => c).map((color) => (
                              <div key={color} className="flex items-center gap-4 border-b border-surface-border/50 pb-3 last:border-0 last:pb-0">
                                <span className="font-bold uppercase text-xs w-24 shrink-0 text-brand-primary">{color}</span>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {fotosPreview.map((url, index) => {
                                    const keyMatch = formData.imagenesPorColor ? Object.keys(formData.imagenesPorColor).find(k => k.toLowerCase() === color.toLowerCase()) : undefined;
                                    const savedUrl = keyMatch && typeof formData.imagenesPorColor[keyMatch] === 'string' ? formData.imagenesPorColor[keyMatch].trim() : undefined;
                                    return (
                                      <div
                                        key={index}
                                        className={`relative w-16 h-16 rounded-lg border-2 cursor-pointer shrink-0 transition-all group ${savedUrl === url ? 'border-brand-primary ring-2 ring-brand-primary/20 scale-105' : 'border-transparent hover:border-brand-primary/50'}`}
                                        onClick={() => setFormData(prev => ({ ...prev, imagenesPorColor: { ...(prev.imagenesPorColor || {}), [color]: url } }))}
                                      >
                                        <img src={url} className="w-full h-full object-contain bg-slate-50 rounded-md" />
                                        {savedUrl === url && (
                                          <div className="absolute -top-2 -right-2 bg-brand-primary text-white rounded-full p-0.5 shadow-md z-10">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                          </div>
                                        )}
                                        <button
                                          className="absolute bottom-1 right-1 flex items-center justify-center w-6 h-6 bg-black/50 hover:bg-black/80 rounded-full transition-colors z-20"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setImagenAmpliada(url);
                                          }}
                                          title="Ampliar imagen"
                                          type="button"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-white"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                                        </button>
                                      </div>
                                    )
                                  })}
                                  {(() => {
                                    const keyMatch = formData.imagenesPorColor ? Object.keys(formData.imagenesPorColor).find(k => k.toLowerCase() === color.toLowerCase()) : undefined;
                                    const savedUrl = keyMatch && typeof formData.imagenesPorColor[keyMatch] === 'string' ? formData.imagenesPorColor[keyMatch].trim() : undefined;
                                    return savedUrl && (
                                      <button
                                        className="text-xs text-red-500 hover:text-red-700 hover:underline px-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const next = { ...formData.imagenesPorColor };
                                          delete next[color];
                                          setFormData(prev => ({ ...prev, imagenesPorColor: next }));
                                        }}
                                      >Quitar</button>
                                    );
                                  })()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
                                    <th key={color} className="pb-2 border-b border-surface-border font-bold uppercase text-xs tracking-wider">
                                      {color}
                                    </th>
                                  ))
                                ) : (
                                  <th className="pb-2 border-b border-surface-border font-bold uppercase text-xs tracking-wider">
                                    Cantidad
                                  </th>
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
                                        <div className="flex items-end gap-2 pb-1">
                                          <div className="flex flex-col items-center">
                                            <span className="text-[9px] uppercase font-bold text-foreground/50 mb-1">Stock Actual</span>
                                            <span className="text-sm font-medium w-12 text-center text-foreground/70 bg-surface-border/30 rounded py-1.5" title="Stock Actual">
                                              {formData.stockPorTalla?.[talla]?.[color] || "0"}
                                            </span>
                                          </div>
                                          <span className="text-foreground/40 font-bold mb-2">+</span>
                                          <div className="flex flex-col items-center flex-1">
                                            <span className="text-[9px] uppercase font-bold text-brand-primary/80 mb-1">Sumar Nueva Cantidad</span>
                                            <input
                                              type="number" min="0"
                                              value={formData.nuevoStockPorTalla?.[talla]?.[color] || ""}
                                              onChange={(e) => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setFormData({
                                                  ...formData,
                                                  nuevoStockPorTalla: {
                                                    ...formData.nuevoStockPorTalla,
                                                    [talla]: {
                                                      ...(formData.nuevoStockPorTalla?.[talla] || {}),
                                                      [color]: e.target.value ? val.toString() : ""
                                                    }
                                                  }
                                                });
                                              }}
                                              className="w-full bg-surface border-2 border-brand-primary/20 p-1 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary font-mono text-center hover:border-brand-primary/40 transition-colors"
                                              placeholder="0"
                                            />
                                          </div>
                                        </div>
                                      </td>
                                    ))
                                  ) : (
                                    <td className="py-2 pr-2 border-b border-surface-border/50">
                                      <div className="flex items-end gap-2 pb-1">
                                        <div className="flex flex-col items-center">
                                          <span className="text-[9px] uppercase font-bold text-foreground/50 mb-1">Stock Actual</span>
                                          <span className="text-sm font-medium w-12 text-center text-foreground/70 bg-surface-border/30 rounded py-1.5" title="Stock Actual">
                                            {formData.stockPorTalla?.[talla]?.['Unico'] || "0"}
                                          </span>
                                        </div>
                                        <span className="text-foreground/40 font-bold mb-2">+</span>
                                        <div className="flex flex-col items-center flex-1">
                                          <span className="text-[9px] uppercase font-bold text-brand-primary/80 mb-1">Sumar Nueva Cantidad</span>
                                          <input
                                            type="number" min="0"
                                            value={formData.nuevoStockPorTalla?.[talla]?.['Unico'] || ""}
                                            onChange={(e) => {
                                              const val = Math.max(0, Number(e.target.value));
                                              setFormData({
                                                ...formData,
                                                nuevoStockPorTalla: {
                                                  ...formData.nuevoStockPorTalla,
                                                  [talla]: {
                                                    ...(formData.nuevoStockPorTalla?.[talla] || {}),
                                                    ['Unico']: e.target.value ? val.toString() : ""
                                                  }
                                                }
                                              });
                                            }}
                                            className="w-full bg-surface border-2 border-brand-primary/20 p-1 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary font-mono text-center hover:border-brand-primary/40 transition-colors"
                                            placeholder="0"
                                          />
                                        </div>
                                      </div>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="mt-4 p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/10 text-xs text-foreground/70 flex items-start gap-2">
                            <span className="text-base leading-none">💡</span>
                            <p><strong>Consejo:</strong> El número en gris es tu <strong>stock actual</strong>. Usa el campo de al lado para ingresar <strong>cuánto stock nuevo vas a sumar</strong>. Al guardar, ambos valores se sumarán automáticamente.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                          <label className="block text-sm font-bold text-yellow-700 dark:text-yellow-500 mb-2">Cantidad de Stock General</label>
                          <p className="text-xs text-foreground/60 mb-3">Selecciona tallas para llevar un inventario exacto. De lo contrario, usa este stock general.</p>
                          <input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} placeholder="Ej. 12" className="w-full max-w-xs bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-yellow-500 outline-none" />
                        </div>
                      )}
                    </>
                  )}
                  {formData.isConjunto && (
                    <div className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-xl space-y-6">

                      {tallasSeleccionadas.length === 0 && (
                        <div>
                          <h3 className="font-bold text-foreground text-base mb-2">Cantidad de Combos en Stock</h3>
                          <p className="text-xs text-foreground/60 mb-2">¿Cuántos de estos conjuntos vas a armar y poner a la venta?</p>
                          <input type="number" min="0" value={formData.stockCount} onChange={e => setFormData({ ...formData, stockCount: e.target.value })} placeholder="Ej. 5" className="w-full max-w-xs bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                        </div>
                      )}

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
                                    <img src={prod.imagenes?.[0] || "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=500&q=80"} alt={prod.nombre} className="w-10 h-10 rounded object-contain bg-slate-50 shrink-0" />
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
                                            setFormData({ ...formData, piezasDetalle: newDet });
                                          } else {
                                            newDet[prod.id] = { ...newDet[prod.id], cantidad: curr - 1 };
                                            setFormData({ ...formData, piezasDetalle: newDet });
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
                                        setFormData({ ...formData, piezasDetalle: newDet });
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
                                            setFormData({ ...formData, piezasDetalle: newDet });
                                          }}
                                          className="w-full text-xs p-2 rounded border border-brand-primary/30 outline-none focus:border-brand-primary bg-background"
                                        >
                                          <option value="">Selecciona Talla</option>
                                          {prod.tallas.map((t: string) => <option key={t} value={t}>{t}</option>)}
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
                                            setFormData({ ...formData, piezasDetalle: newDet });
                                          }}
                                          className="w-full text-xs p-2 rounded border border-brand-primary/30 outline-none focus:border-brand-primary bg-background"
                                        >
                                          <option value="">Selecciona Color</option>
                                          {prod.colores.map((c: string) => <option key={c} value={c}>{c}</option>)}
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
                        onChange={(e) => setCategoriaAEditar({ ...categoriaAEditar, new: e.target.value })}
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
                        <button onClick={() => setCategoriaAEditar({ old: cat, new: cat })} className="p-2 hover:bg-brand-primary/10 text-brand-primary rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
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

      {/* MODAL IMAGEN AMPLIADA */}
      <AnimatePresence>
        {imagenAmpliada && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm cursor-zoom-out"
            onClick={() => setImagenAmpliada(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl max-h-[90vh] flex items-center justify-center cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setImagenAmpliada(null)}
                className="absolute -top-12 right-0 text-white hover:text-brand-primary bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={imagenAmpliada}
                alt="Imagen ampliada"
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl ring-1 ring-white/20"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* TALLA EDIT MODAL */}
      <AnimatePresence>
        {tallaEditando && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTallaEditando(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background w-full max-w-sm rounded-3xl overflow-hidden relative z-10 shadow-2xl border border-surface-border"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Edit className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">Editar Talla</h2>
                <p className="text-sm text-foreground/60 mb-6">Cambia el nombre de la talla. Conservarás tu inventario.</p>

                <input
                  type="text"
                  value={tallaEditando.new}
                  onChange={(e) => setTallaEditando({ ...tallaEditando, new: e.target.value })}
                  className="w-full bg-surface border border-surface-border text-foreground text-sm rounded-xl focus:ring-brand-primary focus:border-brand-primary p-3 mb-6 text-center font-bold"
                />

                <div className="flex gap-3">
                  <button onClick={() => setTallaEditando(null)} className="flex-1 bg-surface border border-surface-border text-foreground font-bold py-3 rounded-xl hover:bg-background transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const oldTalla = tallaEditando.old;
                      const newTalla = tallaEditando.new.trim();
                      if (newTalla && newTalla !== oldTalla) {
                        if (tallasDisponibles.includes(newTalla)) {
                          alert("Esa talla ya existe.");
                          return;
                        }
                        setTallasDisponibles(tallasDisponibles.map(x => x === oldTalla ? newTalla : x));
                        setTallasSeleccionadas(tallasSeleccionadas.map(x => x === oldTalla ? newTalla : x));

                        const newStockPorTalla = { ...formData.stockPorTalla };
                        if (newStockPorTalla[oldTalla] !== undefined) {
                          newStockPorTalla[newTalla] = newStockPorTalla[oldTalla];
                          delete newStockPorTalla[oldTalla];
                          setFormData({ ...formData, stockPorTalla: newStockPorTalla });
                        }
                      }
                      setTallaEditando(null);
                    }}
                    className="flex-1 bg-blue-500 text-white font-bold py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-md"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TALLA DELETE MODAL */}
      <AnimatePresence>
        {tallaABorrar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTallaABorrar(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background w-full max-w-sm rounded-3xl overflow-hidden relative z-10 shadow-2xl border border-surface-border"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-foreground mb-2">Eliminar Talla</h2>
                <p className="text-sm text-foreground/60 mb-6">
                  ¿Estás seguro de que deseas eliminar la talla <span className="font-bold text-foreground">"{tallaABorrar}"</span>?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setTallaABorrar(null)} className="flex-1 bg-surface border border-surface-border text-foreground font-bold py-3 rounded-xl hover:bg-background transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      const talla = tallaABorrar;
                      setTallasDisponibles(tallasDisponibles.filter(t => t !== talla));
                      setTallasSeleccionadas(tallasSeleccionadas.filter(t => t !== talla));
                      const newStockPorTalla = { ...formData.stockPorTalla };
                      delete newStockPorTalla[talla];
                      setFormData({ ...formData, stockPorTalla: newStockPorTalla });
                      setTallaABorrar(null);
                    }}
                    className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-colors shadow-md"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Cropper */}
      <AnimatePresence>
        {imageToCrop && (
          <ImageCropperModal
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={4 / 5}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
