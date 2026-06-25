const fs = require('fs');
let code = fs.readFileSync('src/app/admin/productos/page.tsx', 'utf8');

// 1. Add fields to formData initial state
code = code.replace(
  'material: ""',
  'material: "",\n    marca: "",\n    precioOriginal: "",\n    isConjunto: false,\n    piezasDetalle: {} as any'
);

// 2. Add same to abrirModalNueva
code = code.replace(
  'setFormData({ nombre: "", costoProveedor: "", precioVenta: "", categoria: "", coleccion: "", colores: "", stockCount: "", material: "" });',
  'setFormData({ nombre: "", costoProveedor: "", precioVenta: "", precioOriginal: "", categoria: "", coleccion: "", colores: "", stockCount: "", material: "", marca: "", isConjunto: false, piezasDetalle: {} });'
);

// 3. Add to abrirModalEditar
code = code.replace(
  'precioVenta: producto.precioVenta?.toString() || "",',
  'precioVenta: producto.precioVenta?.toString() || "",\n      precioOriginal: producto.precioOriginal?.toString() || "",'
);
code = code.replace(
  'material: producto.material || ""',
  'material: producto.material || "",\n      marca: producto.marca || "",\n      isConjunto: producto.isConjunto || false,\n      piezasDetalle: producto.piezasDetalle || {}'
);

// 4. Add to dataAEnviar in manejarGuardar
code = code.replace(
  'precioVenta: Number(formData.precioVenta),',
  'precioVenta: Number(formData.precioVenta),\n      precioOriginal: formData.precioOriginal ? Number(formData.precioOriginal) : null,'
);
code = code.replace(
  'material: formData.material,',
  'material: formData.material,\n      marca: formData.marca,\n      isConjunto: formData.isConjunto,\n      piezasDetalle: formData.piezasDetalle,'
);

// 5. Add Inputs for precioOriginal, marca, material in the UI
code = code.replace(
  '<input type="number" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} placeholder="Ej. 150" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />\n                  </div>\n                </div>',
  '<input type="number" value={formData.precioVenta} onChange={e => setFormData({...formData, precioVenta: e.target.value})} placeholder="Ej. 150" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />\n                  </div>\n                  <div>\n                    <label className="block text-sm font-bold text-foreground mb-2">Precio Orginal (Para Descuento)</label>\n                    <input type="number" value={formData.precioOriginal} onChange={e => setFormData({...formData, precioOriginal: e.target.value})} placeholder="Ej. 200" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />\n                  </div>\n                  <div>\n                    <label className="block text-sm font-bold text-foreground mb-2">Marca</label>\n                    <input type="text" value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} placeholder="Ej. Zara" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />\n                  </div>\n                  <div>\n                    <label className="block text-sm font-bold text-foreground mb-2">Material / Tela</label>\n                    <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} placeholder="Ej. Algodón 100%" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />\n                  </div>\n                </div>'
);

// 6. Change grid-cols-3 to grid-cols-3 md:grid-cols-3 gap-6 for that section to accomodate 6 inputs
code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6">',
  '<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">'
);

// 7. Add Checkbox "Es Conjunto / Combo" and toggle the Variantes y Stock
code = code.replace(
  '<h3 className="font-bold text-brand-primary uppercase tracking-widest text-xs">Variantes y Stock</h3>',
  '<div className="flex items-center gap-3 mb-6 bg-surface p-4 rounded-xl border border-surface-border cursor-pointer" onClick={() => setFormData({...formData, isConjunto: !formData.isConjunto})}>\n                    <input type="checkbox" checked={formData.isConjunto} onChange={() => {}} className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary" />\n                    <span className="font-bold text-foreground">¿Es un Conjunto / Combo?</span>\n                    <p className="text-xs text-foreground/50 ml-auto">Agrupa múltiples prendas</p>\n                  </div>\n                  \n                  {!formData.isConjunto && (\n                    <>\n                      <h3 className="font-bold text-brand-primary uppercase tracking-widest text-xs mb-4">Variantes y Stock</h3>'
);

// Wrap the rest of the Variantes y stock in a fragment
code = code.replace(
  '</div>\n                  </div>\n                </div>\n              </div>\n\n              <div className="p-6 border-t',
  '</div>\n                  </div>\n                </>\n                )}\n                </div>\n              </div>\n\n              <div className="p-6 border-t'
);

fs.writeFileSync('src/app/admin/productos/page.tsx', code);
