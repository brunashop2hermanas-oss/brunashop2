const fs = require('fs');
const filePath = 'src/app/admin/productos/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const modalsJSX = `
        {/* TALLA EDIT MODAL */}
        <AnimatePresence>
          {tallaEditando && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTallaEditando(null)} />
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
                    onChange={(e) => setTallaEditando({...tallaEditando, new: e.target.value})}
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
                            
                            const newStockPorTalla = { ...stockPorTalla };
                            if (newStockPorTalla[oldTalla] !== undefined) {
                                newStockPorTalla[newTalla] = newStockPorTalla[oldTalla];
                                delete newStockPorTalla[oldTalla];
                                setStockPorTalla(newStockPorTalla);
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
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setTallaABorrar(null)} />
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
                        const newStockPorTalla = { ...stockPorTalla };
                        delete newStockPorTalla[talla];
                        setStockPorTalla(newStockPorTalla);
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
`;

const lastDivIndex = content.lastIndexOf('</div>');
if (lastDivIndex !== -1) {
    content = content.substring(0, lastDivIndex) + modalsJSX + '\n' + content.substring(lastDivIndex);
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Appended modal JSX!');
} else {
    console.log('Failed to find end of file block.');
}
