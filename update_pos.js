const fs = require('fs');
const file = 'src/app/admin/nueva-venta/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update carrito interface
content = content.replace(
  'const [carrito, setCarrito] = useState<{ id: string, nombre: string, precio: number, cantidad: number }[]>([]);',
  'const [carrito, setCarrito] = useState<{ id: string, itemUnicoId: string, nombre: string, precio: number, cantidad: number, tallaSeleccionada: string, colorSeleccionado: string }[]>([]);'
);

// 2. Add Modal state
content = content.replace(
  'const [busquedaProducto, setBusquedaProducto] = useState(\'\');',
  `const [busquedaProducto, setBusquedaProducto] = useState('');\n  const [productoVistaRapida, setProductoVistaRapida] = useState<any>(null);`
);

// 3. Update agregarAlCarrito to just open modal
content = content.replace(
  /const agregarAlCarrito = \(prod: any\) => \{[\s\S]*?\};\n/m,
  `const agregarAlCarrito = (prod: any) => {
    if (prod.stockCount <= 0 && !prod.enPreventa) return;
    if ((prod.tallas && prod.tallas.length > 0) || (prod.colores && prod.colores.length > 0) || prod.isConjunto) {
      setProductoVistaRapida(prod);
      return;
    }
    agregarAlCarritoDefinitivo(prod, "", "");
  };

  const agregarAlCarritoDefinitivo = (prod: any, talla: string, color: string) => {
    setCarrito(prev => {
      const itemUnicoId = \`\${prod.id}-\${talla}-\${color}\`;
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
  };\n`
);

// 4. Update modificarCantidad to use itemUnicoId
content = content.replace(
  'const modificarCantidad = (id: string, delta: number) => {',
  'const modificarCantidad = (itemUnicoId: string, delta: number) => {'
).replace(
  'if (item.id === id) {',
  'if (item.itemUnicoId === itemUnicoId) {'
).replace(
  'const prodDb = productos.find(p => p.id === id);',
  'const prodDb = productos.find(p => p.id === item.id);'
);

// 5. Update eliminarDelCarrito
content = content.replace(
  'const eliminarDelCarrito = (id: string) => {',
  'const eliminarDelCarrito = (itemUnicoId: string) => {'
).replace(
  'prev.filter(item => item.id !== id)',
  'prev.filter(item => item.itemUnicoId !== itemUnicoId)'
);

// 6. Update completarVenta itemsParaBD
content = content.replace(
  /const itemsParaBD = carrito.map\(item => \(\{\s*prendaId: item.id,\s*cantidad: item.cantidad,\s*precioUnitario: item.precio\s*\}\)\);/m,
  `const itemsParaBD = carrito.map(item => ({
      prendaId: item.id,
      cantidad: item.cantidad,
      precioUnitario: item.precio,
      talla: item.tallaSeleccionada || undefined,
      color: item.colorSeleccionado || undefined
    }));`
);

// 7. Update Cart Render
content = content.replace(
  /key=\{item.id\} className="bg-background border border-surface-border rounded-xl p-4 flex items-center justify-between"/m,
  'key={item.itemUnicoId} className="bg-background border border-surface-border rounded-xl p-4 flex items-center justify-between"'
).replace(
  /<div className="flex-1">\s*<h4 className="font-bold text-sm text-foreground truncate max-w-\[150px\]">\{item\.nombre\}<\/h4>\s*<p className="text-brand-primary font-bold text-sm mt-1">Bs\. \{item\.precio\}<\/p>\s*<\/div>/m,
  `<div className="flex-1">
                  <h4 className="font-bold text-sm text-foreground truncate max-w-[150px]">{item.nombre}</h4>
                  {(item.tallaSeleccionada || item.colorSeleccionado) && (
                    <p className="text-[10px] text-foreground/50 uppercase font-bold mt-0.5">
                      {item.tallaSeleccionada && \`T: \${item.tallaSeleccionada}\`} {item.tallaSeleccionada && item.colorSeleccionado && '|'} {item.colorSeleccionado && \`C: \${item.colorSeleccionado}\`}
                    </p>
                  )}
                  <p className="text-brand-primary font-bold text-sm mt-1">Bs. {item.precio}</p>
                </div>`
).replace(
  /onClick=\{\(\) => modificarCantidad\(item\.id, -1\)\}/m,
  'onClick={() => modificarCantidad(item.itemUnicoId, -1)}'
).replace(
  /onClick=\{\(\) => modificarCantidad\(item\.id, 1\)\}/m,
  'onClick={() => modificarCantidad(item.itemUnicoId, 1)}'
).replace(
  /onClick=\{\(\) => eliminarDelCarrito\(item\.id\)\}/m,
  'onClick={() => eliminarDelCarrito(item.itemUnicoId)}'
);

// 8. Update Product Card (Adding Tags)
content = content.replace(
  /\{prod\.stockCount <= 0 && \([\s\S]*?AGOTADO[\s\S]*?\}\)/m,
  `{prod.stockCount <= 0 && !prod.enPreventa && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">AGOTADO</span>
                  )}
                  {prod.enPreventa && (
                    <span className="absolute top-2 right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">PREVENTA</span>
                  )}
                  {prod.isConjunto && (
                    <span className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">CONJUNTO</span>
                  )}
                  {prod.precioOriginal && prod.precioOriginal > prod.precioVenta && (
                    <span className="absolute bottom-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md z-10">-{Math.round((1 - prod.precioVenta / prod.precioOriginal) * 100)}%</span>
                  )}`
);

// 9. Add the POS Modal component
const posModalCode = `
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
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-black text-brand-primary">Bs. {producto.precioVenta}</span>
            {producto.precioOriginal && producto.precioOriginal > producto.precioVenta && (
              <span className="text-sm line-through text-foreground/40">Bs. {producto.precioOriginal}</span>
            )}
          </div>
          
          {producto.isConjunto && producto.piezasDetalle && (
            <div className="mb-6 bg-surface p-4 rounded-xl border border-surface-border">
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/50 block mb-3">Piezas del Conjunto:</span>
              <ul className="space-y-3">
                {Object.values(typeof producto.piezasDetalle === 'string' ? JSON.parse(producto.piezasDetalle) : producto.piezasDetalle).map((pieza: any) => {
                  const pRef = productosAll.find(p => p.id === pieza.id);
                  return (
                    <li key={pieza.id} className="flex gap-3 text-sm">
                      <div className="flex-1">
                        <span className="font-bold">{pieza.cantidad}x</span> {pRef?.nombre || "Prenda"}
                        {(pieza.tallaEspecifica || pieza.colorEspecifico) && (
                          <div className="text-[10px] text-foreground/50 uppercase font-bold mt-1">
                            {pieza.tallaEspecifica && \`T: \${pieza.tallaEspecifica} \`}
                            {pieza.colorEspecifico && \`| C: \${pieza.colorEspecifico}\`}
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
                  <button key={t} onClick={() => setTalla(t)} className={\`px-4 py-2 text-sm rounded-lg border transition-all \${talla === t ? 'border-brand-primary bg-brand-primary text-white font-bold' : 'border-surface-border bg-surface text-foreground'}\`}>{t}</button>
                ))}
              </div>
            </div>
          )}

          {!producto.isConjunto && colores.length > 0 && (
            <div className="mb-6">
              <span className="text-xs font-bold uppercase tracking-widest block mb-2">Colores</span>
              <div className="flex gap-2 flex-wrap">
                {colores.map((c: string) => (
                  <button key={c} onClick={() => setColor(c)} className={\`px-4 py-2 text-sm rounded-lg border transition-all capitalize \${color === c ? 'border-brand-primary bg-brand-primary text-white font-bold' : 'border-surface-border bg-surface text-foreground'}\`}>{c}</button>
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
`;

content = content + '\n' + posModalCode;

// Inject the <AnimatePresence> modal inside the main render
content = content.replace(
  '{/* Modal Venta Completada */}',
  `{/* Modal Vista Rápida POS */}
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

      {/* Modal Venta Completada */}`
);

if (!content.includes(' X ') && !content.includes(', X')) {
  content = content.replace('Search, Plus,', 'Search, Plus, X,');
}

fs.writeFileSync(file, content);
console.log('Update script executed successfully.');
