const fs = require('fs');

// 2. Fix admin/clientas/page.tsx
let clientasCode = fs.readFileSync('src/app/admin/clientas/page.tsx', 'utf8');

const tableTag = '<table className="w-full text-left border-collapse">';
if (clientasCode.includes(tableTag)) {
  clientasCode = clientasCode.replace(tableTag, '<table className="w-full text-left border-collapse hidden lg:table">');
}

const tableEnd = '          </table>\n        </div>';
if (clientasCode.includes(tableEnd) && !clientasCode.includes('lg:hidden')) {
  const cardView = `          </table>
        </div>
        
        {/* Vista Móvil (Tarjetas) */}
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          ) : clientasFiltradas.length > 0 ? (
            clientasFiltradas.map((clienta) => (
              <div key={clienta.id} className="bg-surface border border-surface-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start border-b border-surface-border pb-3">
                  <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight">{clienta.nombre}</h3>
                    <div className="flex flex-col gap-1 mt-2">
                      <div className="flex items-center gap-2 text-foreground/80 text-sm font-medium">
                        <Fingerprint className="w-4 h-4 text-brand-primary" />
                        {clienta.ci || "Sin CI"}
                      </div>
                      <a 
                        href={\`https://wa.me/\${clienta.celular?.startsWith("591") ? clienta.celular : \`591\${clienta.celular}\`}\`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground/80 text-sm font-medium hover:text-brand-primary hover:underline cursor-pointer"
                      >
                        <Phone className="w-4 h-4 text-brand-primary" />
                        {clienta.celular || "Sin Celular"}
                      </a>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-xs uppercase tracking-widest text-foreground/50 font-bold">Puntos</span>
                    <div className="inline-flex items-center gap-1 bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 px-2 py-1 rounded-lg font-black text-sm">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {clienta.prendasCompradas}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-background/50 p-3 rounded-lg border border-surface-border">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Pedidos</p>
                    <p className="font-black text-foreground">{clienta.totalPedidos}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-foreground/50">Gastado</p>
                    <p className="font-bold text-brand-primary">Bs. {clienta.dineroGastado.toFixed(2)}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleImprimirClienta(clienta)}
                  className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary hover:text-white px-4 py-2 mt-1 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 w-full"
                >
                  <FileText className="w-4 h-4" /> Ver / Imprimir PDF
                </button>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-foreground/50 font-medium bg-surface rounded-xl">
              {clientas.length === 0 ? "Todavía no hay clientas registradas." : "No se encontró ninguna clienta con esos datos."}
            </div>
          )}
        </div>`;
  clientasCode = clientasCode.replace(tableEnd, cardView);
}

fs.writeFileSync('src/app/admin/clientas/page.tsx', clientasCode);
console.log('Fixed clientas/page.tsx');
