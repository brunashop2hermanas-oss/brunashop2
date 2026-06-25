const fs = require('fs');
let code = fs.readFileSync('src/app/admin/productos/page.tsx', 'utf8');

const target = `                      <label className="block text-sm font-bold text-foreground mb-2">Cantidad en Stock</label>
                      <input type="number" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} placeholder="Ej. 12" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                    </div>
                  </div>
                </div>
              </div>`;

const replacement = `                      <label className="block text-sm font-bold text-foreground mb-2">Cantidad en Stock</label>
                      <input type="number" value={formData.stockCount} onChange={e => setFormData({...formData, stockCount: e.target.value})} placeholder="Ej. 12" className="w-full bg-surface border border-surface-border p-3 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none" />
                    </div>
                  </div>
                  </>
                  ]}

                  {formData.isConjunto && (
                    <div className="p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-xl mt-4">
                      <h3 className="font-bold text-brand-primary text-sm mb-3">Piezas del Conjunto</h3>
                      <p className="text-xs text-foreground/70 mb-4">Selecciona las prendas que conforman este conjunto y su cantidad.</p>
                      <div className="flex flex-col gap-3 max-h-60 overflow-y-auto pr-2">
                        {productos.filter(p => !p.isConjunto).map(prod => (
                          <div key={prod.id} className="flex items-center justify-between p-3 bg-surface border border-surface-border rounded-lg">
                            <div className="flex items-center gap-3">
                              <img src={prod.imagenes[0]} alt={prod.nombre} className="w-10 h-10 rounded object-cover" />
                              <div>
                                <p className="text-sm font-bold truncate max-w-[200px]">{prod.nombre}</p>
                                <p className="text-xs text-foreground/50">Stock real: {prod.stockCount} ‘ {prod.colores?.join(", ")}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => {
                                const curr = formData.piezasDetalle?[prod.id]?.cantidad || 0;
                                if (curr > 0) {
                                  const newDet = { ...formData.piezasDetalle };
                                  if (curr === 1) {
                                    delete newDet[prod.id];
                                    setFormData({...formData, piezasDetalle: newDet, piezasId: Object.keys(newDet)});
                                  } else {
                                    newDet[prod.id] = { ...newDet[prod.id], cantidad: curr - 1 };
                                    setFormData({...formData, piezasDetalle: newDet});
                                  }
                                }
                              }} className="w-6 h-6 flex items-center justify-center bg-surface-border rounded">-</button>
                              <span className="text-sm font-bold w-6 text-center">{formData.piezasDetalle?[prod.id]?.cantidad || 0}</span>
                              <button onClick={() => {
                                const newDet = { ...formData.piezasDetalle };
                                newDet[prod.id] = { id: prod.id, cantidad: (newDet[prod.id]?.cantidad || 0) + 1, tallas: prod.tallas, colores: prod.colores, material: prod.material };
                                setFormData({...formData, piezasDetalle: newDet, piezasId: Object.keys(newDet)});
                              }} className="w-6 h-6 flex items-center justify-center bg-brand-primary text-white rounded">+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/app/admin/productos/page.tsx', code);
console.log("Done");
