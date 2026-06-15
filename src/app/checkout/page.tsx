"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, CheckCircle, ShieldCheck, Bus, CreditCard, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getPrendas } from "@/app/actions/productos";
import { createVenta } from "@/app/actions/ventas";
import { getConfiguracion } from "@/app/actions/config";
import { uploadImage } from "@/app/actions/upload";
import { compressImage } from "@/lib/imageCompression";

const DEPARTAMENTOS = [
  "La Paz", "Santa Cruz", "Cochabamba", "Oruro", "Potosí", "Chuquisaca", "Tarija", "Beni", "Pando"
];

export default function CheckoutPage() {
  const [paso, setPaso] = useState(1); // 1: Formulario, 2: Éxito
  const [comprobante, setComprobante] = useState<File | null>(null);
  
  // Estado para simular carrito de compras con productos reales de la BD
  const [carrito, setCarrito] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Para propósitos de prueba: Cargar 1 o 2 prendas reales del catálogo
    const cargarDatos = async () => {
      // 1. Cargar Configuración de la Tienda (QR y Banco)
      const resConfig = await getConfiguracion();
      if (resConfig.success) {
        setConfig(resConfig.data);
      }

      // 2. Cargar carrito simulado
      const res = await getPrendas();
      if (res.success && res.data && res.data.length > 0) {
        // Tomar hasta 2 prendas que tengan stock
        const disponibles = res.data.filter((p: any) => p.stockCount > 0).slice(0, 2);
        
        const itemsCarrito = disponibles.map((p: any) => ({
          prendaId: p.id,
          nombre: p.nombre,
          precioUnitario: p.precioVenta,
          cantidad: 1
        }));
        setCarrito(itemsCarrito);
      }
      setIsLoading(false);
    };
    cargarDatos();
  }, []);

  const totalAPagar = carrito.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);

  const handleSubirComprobante = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComprobante(e.target.files[0]);
    }
  };

  const enviarPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (carrito.length === 0) {
      alert("No tienes prendas en el carrito.");
      return;
    }
    if (!comprobante) {
      alert("Por favor, sube la foto de tu comprobante de pago antes de continuar.");
      return;
    }

    setIsSubmitting(true);
    
    let comprobanteRealUrl = "";
    try {
      const compressedFile = await compressImage(comprobante);
      const fileData = new FormData();
      fileData.append("file", compressedFile);
      const resUpload = await uploadImage(fileData);
      if (resUpload.success && resUpload.url) {
        comprobanteRealUrl = resUpload.url;
      } else {
        alert("Error subiendo el comprobante: " + resUpload.error);
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      alert("Error inesperado subiendo el comprobante.");
      setIsSubmitting(false);
      return;
    }
    
    const formData = new FormData(e.currentTarget);
    const data = {
      nombres: formData.get("nombres") as string,
      apellidoPaterno: formData.get("apellidoPaterno") as string,
      apellidoMaterno: formData.get("apellidoMaterno") as string,
      ci: formData.get("ci") as string,
      celular: formData.get("celular") as string,
      ciudadDestino: formData.get("ciudadDestino") as string,
      comprobanteUrl: comprobanteRealUrl, 
      items: carrito,
      total: totalAPagar
    };

    const res = await createVenta(data);
    setIsSubmitting(false);

    if (res.success) {
      setPaso(2);
    } else {
      alert("Hubo un error al procesar tu venta: " + res.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/">
            <button className="p-2 bg-surface hover:bg-surface-border rounded-full transition-colors text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <h1 className="text-3xl font-extrabold text-foreground">Finalizar Compra</h1>
        </div>

        <AnimatePresence mode="wait">
          {paso === 1 ? (
            <motion.div 
              key="formulario"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              
              {/* Formulario Principal */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* SECCIÓN 1: Datos de Envío */}
                <div className="glass p-6 md:p-8 rounded-3xl border border-surface-border shadow-3d">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                    <Bus className="w-6 h-6 text-brand-primary" />
                    Datos para el Envío
                  </h2>
                  <div className="bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm font-medium text-foreground/80">
                      Todos nuestros envíos llegan de manera segura a la <strong className="text-brand-primary">Terminal de Buses</strong> de tu ciudad. Nos pondremos en contacto contigo si el envío requiere un pago en destino.
                    </p>
                  </div>
                  
                  <form id="checkout-form" onSubmit={enviarPedido} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Nombres</label>
                        <input name="nombres" required type="text" placeholder="Ej: María Fernanda" className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Apellido Paterno</label>
                        <input name="apellidoPaterno" required type="text" placeholder="Ej: Pérez" className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Apellido Materno</label>
                        <input name="apellidoMaterno" type="text" placeholder="Ej: Gómez (Opcional)" className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Carnet de Identidad (CI)</label>
                      <input name="ci" required type="text" placeholder="Ej: 1234567 LP" className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all" />
                      <p className="text-xs text-foreground/50 mt-1">Requerido para recoger en terminal</p>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground mb-2">Celular de Contacto</label>
                      <input name="celular" required type="tel" placeholder="Ej: 71234567" className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground placeholder-foreground/40 font-medium transition-all" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-foreground mb-2">Ciudad de Destino (Terminal)</label>
                      <select name="ciudadDestino" required className="w-full bg-surface border border-surface-border px-4 py-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold transition-all cursor-pointer">
                        <option value="">Selecciona tu ciudad...</option>
                        {DEPARTAMENTOS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                      </select>
                    </div>
                  </form>
                </div>

                {/* SECCIÓN 2: Pago y Comprobante */}
                <div className="glass p-6 md:p-8 rounded-3xl border border-surface-border shadow-3d">
                  <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-foreground">
                    <CreditCard className="w-6 h-6 text-green-500" />
                    Pago por Transferencia o QR
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mb-8">
                    {/* QR REAL DESDE LA CONFIGURACION */}
                    <div className="bg-white p-4 rounded-2xl flex justify-center border-2 border-dashed border-gray-300">
                      {config?.qrImagen ? (
                        <img src={config.qrImagen} alt="QR Bancario" className="w-40 h-40 opacity-100 object-contain" />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center text-gray-400 font-bold">QR No Configurado</div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-foreground/60 uppercase font-bold tracking-wider">Banco</p>
                        <p className="font-bold text-foreground text-lg">{config?.bancoNombre || "No configurado"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 uppercase font-bold tracking-wider">Cuenta</p>
                        <p className="font-mono font-bold text-brand-primary text-xl tracking-widest">{config?.bancoCuenta || "No configurado"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-foreground/60 uppercase font-bold tracking-wider">Titular</p>
                        <p className="font-bold text-foreground">{config?.bancoTitular || "No configurado"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-surface-border rounded-2xl p-6 text-center hover:bg-surface transition-colors relative overflow-hidden group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleSubirComprobante}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full ${comprobante ? 'bg-green-500/20 text-green-500' : 'bg-brand-primary/10 text-brand-primary'} group-hover:scale-110 transition-transform`}>
                        {comprobante ? <CheckCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">
                          {comprobante ? '¡Comprobante Subido!' : 'Toca aquí para subir tu foto del depósito'}
                        </p>
                        <p className="text-sm text-foreground/60 mt-1">
                          {comprobante ? comprobante.name : 'Formatos: JPG, PNG'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Barra Lateral: Resumen */}
              <div className="lg:col-span-1">
                <div className="glass p-6 rounded-3xl border border-surface-border shadow-3d sticky top-10">
                  <h3 className="font-bold text-lg text-foreground border-b border-surface-border pb-4 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" /> Tu Pedido
                  </h3>
                  
                  {carrito.length === 0 ? (
                    <div className="text-center py-6 text-foreground/50 text-sm font-medium">
                      No tienes prendas en stock en tu catálogo para simular la compra. Ve al admin y agrega una prenda con stock primero.
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {carrito.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                            <div className="text-foreground/80 font-medium">{item.cantidad}x {item.nombre}</div>
                            <div className="font-bold text-foreground">Bs. {item.precioUnitario}</div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-surface-border pt-4 mb-8">
                        <div className="flex justify-between items-center mb-1">
                          <div className="text-foreground/60 font-bold">Subtotal</div>
                          <div className="font-bold text-foreground">Bs. {totalAPagar.toFixed(2)}</div>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-foreground/60 font-bold">Envío Terminal</div>
                          <div className="font-bold text-brand-primary text-sm">Por coordinar</div>
                        </div>
                      </div>

                      <div className="flex justify-between items-end mb-8 bg-surface p-4 rounded-xl border border-surface-border">
                        <div className="text-lg font-bold text-foreground">Total a pagar:</div>
                        <div className="text-3xl font-black text-brand-primary">Bs. {totalAPagar.toFixed(2)}</div>
                      </div>

                      <button 
                        type="submit" 
                        form="checkout-form"
                        disabled={isSubmitting || carrito.length === 0}
                        className="w-full bg-green-500 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-600 hover:shadow-green-500/30 transition-all flex justify-center items-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Procesando Venta...' : 'Confirmar y Enviar Pedido'} <CheckCircle className="w-5 h-5" />
                      </button>
                      <p className="text-center text-xs text-foreground/50 mt-4 font-medium">Pagos 100% seguros y verificados.</p>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="exito"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto glass p-10 rounded-3xl border border-surface-border shadow-3d text-center"
            >
              <div className="w-24 h-24 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-foreground mb-4">¡Pedido Recibido!</h2>
              <p className="text-foreground/80 text-lg mb-8">
                ¡Gracias por tu compra! Estamos verificando tu comprobante. En breve te contactaremos por WhatsApp para coordinar el envío.
              </p>
              <Link href="/">
                <button className="w-full bg-brand-primary text-background py-4 rounded-xl font-bold shadow-lg hover:bg-brand-accent transition-colors text-lg">
                  Volver al Catálogo
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
