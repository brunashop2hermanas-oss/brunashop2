const fs = require('fs');
const file = 'src/app/admin/nueva-venta/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add provinciaDestino and comprobante to state
content = content.replace(
  'const [destino, setDestino] = useState<string>(\'\');',
  `const [destino, setDestino] = useState<string>('');\n  const [provinciaDestino, setProvinciaDestino] = useState<string>('');\n  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);\n  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);\n  const [isUploading, setIsUploading] = useState(false);`
);

// 2. Add 'uploadImage' import
if (!content.includes('import { uploadImage }')) {
  content = content.replace(
    'import { createVenta } from \'@/app/actions/ventas\';',
    'import { createVenta } from \'@/app/actions/ventas\';\nimport { uploadImage } from \'@/app/actions/upload\';\nimport { compressImage } from \'@/lib/imageUtils\';'
  );
}

// 3. Update completarVenta
const completarVentaNew = `
  const completarVenta = async () => {
    if (carrito.length === 0) return;
    if (!ci) { toast.error("Debes ingresar el CI de la clienta."); return; }
    if (!nombres || !apellidoPaterno || !celular) { toast.error("Debes completar los datos de la clienta."); return; }
    if (tipoEntrega === 'envio' && !destino) { toast.error("Debes seleccionar el departamento."); return; }
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
          finalComprobanteUrl = uploadRes.url;
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
`;

content = content.replace(/const completarVenta = async \(\) => \{[\s\S]*?toast\.error\("Error al procesar la venta: " \+ res\.error\);\n\s*\}\n\s*\};\n/, completarVentaNew);


// 4. Calculations variables in Cart
content = content.replace('const subtotal = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);', '');
content = content.replace('const total = subtotal;', '');

// We insert new calc variables
content = content.replace(
  'const agregarAlCarrito =',
  `
  // Cálculos matemáticos
  const totalCarrito = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalOriginalCarrito = carrito.reduce((acc, item) => {
    const prodDb = productos.find(p => p.id === item.id);
    const precioOriginal = prodDb?.precioOriginal && prodDb.precioOriginal > item.precio ? prodDb.precioOriginal : item.precio;
    return acc + (precioOriginal * item.cantidad);
  }, 0);
  const ahorroTotal = totalOriginalCarrito - totalCarrito;

  const agregarAlCarrito =`
);

// Fix Venta Exitosa modal 'total.toFixed(2)' -> 'totalCarrito.toFixed(2)'
content = content.replace(/\{total\.toFixed\(2\)\}/g, '{totalCarrito.toFixed(2)}');


// 5. Update Envío section with Provincia
content = content.replace(
  /<select\s+value=\{destino\}[\s\S]*?<\/select>/,
  `
                    <div className="space-y-2">
                      <select 
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        className="w-full bg-surface border border-surface-border rounded-lg p-2 text-sm outline-none focus:border-brand-primary cursor-pointer appearance-none"
                      >
                        <option value="">Selecciona Departamento...</option>
                        <option value="La Paz">La Paz</option>
                        <option value="Cochabamba">Cochabamba</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Oruro">Oruro</option>
                        <option value="Potosí">Potosí</option>
                        <option value="Chuquisaca">Chuquisaca (Sucre)</option>
                        <option value="Tarija">Tarija</option>
                        <option value="Beni">Beni</option>
                        <option value="Pando">Pando</option>
                      </select>
                      <input 
                        type="text" 
                        value={provinciaDestino}
                        onChange={(e) => setProvinciaDestino(e.target.value)}
                        placeholder="Ciudad / Municipio / Zona" 
                        className="w-full bg-surface border border-surface-border p-2 rounded-lg outline-none focus:ring-2 focus:ring-brand-primary transition-all text-sm"
                      />
                    </div>
  `
);

// 6. Update QR Upload section
const paymentMethodsHtml = `
            {/* Método de Pago */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button 
                onClick={() => setMetodoPago('efectivo')}
                className={\`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-colors \${metodoPago === 'efectivo' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-surface-border bg-background text-foreground/60 hover:border-brand-primary/50'}\`}
              >
                <Banknote className="w-4 h-4" />
                <span className="text-xs font-bold">Efectivo</span>
              </button>
              <button 
                onClick={() => setMetodoPago('qr')}
                className={\`flex items-center justify-center gap-2 p-2 rounded-xl border-2 transition-colors \${metodoPago === 'qr' ? 'border-brand-primary bg-brand-primary/10 text-brand-primary' : 'border-surface-border bg-background text-foreground/60 hover:border-brand-primary/50'}\`}
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
                        <img src={comprobanteFile ? URL.createObjectURL(comprobanteFile) : comprobanteUrl!} alt="Comprobante" className="w-20 h-20 object-cover rounded-lg shadow-md border border-surface-border" />
                        <div className="flex gap-2 w-full">
                          <button onClick={() => { setComprobanteFile(null); setComprobanteUrl(null); }} className="flex-1 bg-red-500/10 text-red-500 text-xs font-bold py-1.5 rounded-lg">Borrar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
`;

content = content.replace(/\{\/\* Método de Pago \*\/\}[\s\S]*?<\/button>\s*<\/div>/, paymentMethodsHtml);


// 7. Update Resumen Math logic
const resumenHtml = `
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
`;
content = content.replace(/\{\/\* Resumen \*\/\}[\s\S]*?\{\/\* Método de Pago \*\/\}/, resumenHtml + '\n\n            {/* Método de Pago */}');


// 8. Update Product Grid Promotion Visuals
// Find where pricing is displayed in the grid
content = content.replace(
  /<p className="font-black text-brand-primary mt-auto">Bs\. \{prod\.precioVenta\}<\/p>/,
  `
                <div className="mt-auto flex items-end gap-2">
                  <p className="font-black text-brand-primary">Bs. {prod.precioVenta}</p>
                  {prod.precioOriginal && prod.precioOriginal > prod.precioVenta && (
                    <p className="text-xs text-foreground/40 line-through font-bold mb-[2px]">Bs. {prod.precioOriginal}</p>
                  )}
                </div>
  `
);

// 9. WhatsApp Button in "Venta Exitosa" modal
const wppMsg = "encodeURIComponent(`¡Hola ${nombres}! 🌸 Hemos registrado tu compra exitosamente en BrunaShop 2 Hermanas.\\n\\n*Detalles de tu pedido:*\\nTotal: Bs. ${totalCarrito.toFixed(2)}\\n${tipoEntrega === 'envio' ? \`Envío a: ${destino} - ${provinciaDestino}\\nEstado: PREPARANDO 📦\` : 'Estado: ENTREGADO EN TIENDA ✅'}\\n\\n¡Gracias por tu preferencia! ✨`)";

const successButtons = `
              <div className="w-full space-y-3">
                <a 
                  href={\`https://wa.me/591\${celular.replace(/\\s/g, '')}?text=\${${wppMsg}}\`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] text-white font-bold py-3 rounded-xl hover:brightness-110 transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Confirmar a Clienta por WhatsApp
                </a>
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
`;
content = content.replace(/<div className="w-full space-y-3">[\s\S]*?<\/div>\n\s*<\/motion.div>/, successButtons + '\n            </motion.div>');

fs.writeFileSync(file, content);
console.log('Advanced POS updates applied.');
