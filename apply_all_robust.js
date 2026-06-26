const fs = require('fs');

const file = 'src/app/admin/configuracion/page.tsx';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

// 1. Add MessageCircle import
const importIdx = lines.findIndex(l => l.includes('import { Settings, QrCode, Building, ShieldCheck, Upload, Save, Eye, EyeOff, BarChart3, X } from "lucide-react";'));
if (importIdx !== -1) {
  lines[importIdx] = 'import { Settings, QrCode, Building, ShieldCheck, Upload, Save, Eye, EyeOff, BarChart3, X, MessageCircle } from "lucide-react";';
}

// 2. Add states to formData
const formDataIdx = lines.findIndex(l => l.includes('categoriasPrendas: []'));
if (formDataIdx !== -1) {
  lines[formDataIdx] = `    categoriasPrendas: [] as string[],
    msgAprobadoLocal: "",
    msgAprobadoNacional: "",
    msgRechazadoLocal: "",
    msgRechazadoNacional: "",
    msgGuiaLocal: "",
    msgGuiaNacional: ""`;
}

// 3. Add loaded properties to setConfig
const setConfigEndIdx = lines.findIndex(l => l.includes('categoriasPrendas: resConfig.data.categoriasPrendas || ["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"]'));
if (setConfigEndIdx !== -1) {
  lines[setConfigEndIdx] = `          categoriasPrendas: resConfig.data.categoriasPrendas || ["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"],
          msgAprobadoLocal: resConfig.data.msgAprobadoLocal || "",
          msgAprobadoNacional: resConfig.data.msgAprobadoNacional || "",
          msgRechazadoLocal: resConfig.data.msgRechazadoLocal || "",
          msgRechazadoNacional: resConfig.data.msgRechazadoNacional || "",
          msgGuiaLocal: resConfig.data.msgGuiaLocal || "",
          msgGuiaNacional: resConfig.data.msgGuiaNacional || ""`;
}

// 4. Inject UI
const uiIdx = lines.findIndex(l => l.includes('{/* MODAL DE CONFIRMACION PARA GUARDAR */}'));
if (uiIdx !== -1) {
  const whatsappUI = `
          {/* SECCIÓN MENSAJES WHATSAPP */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Plantillas de WhatsApp</h3>
                <p className="text-sm text-gray-500">Configura los mensajes automáticos según si el destino es La Paz (Local) o el resto del país (Nacional).</p>
                <div className="mt-2 text-xs text-gray-400 bg-gray-50 p-2 rounded-lg">
                  <strong>Variables disponibles:</strong> {'{cliente}'} = Nombre | {'{total}'} = Monto | {'{destino}'} = Departamento | {'{urlGuia}'} = Enlace a la guía
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 border-r md:pr-4 border-gray-100">
                <h4 className="font-bold text-gray-700 bg-gray-100 px-3 py-1 inline-block rounded-lg text-sm">Destino Local (La Paz)</h4>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pago Aprobado (Local)</label>
                  <textarea 
                    value={formData.msgAprobadoLocal}
                    onChange={e => setFormData({...formData, msgAprobadoLocal: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Tu pago fue aprobado..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pago Rechazado (Local)</label>
                  <textarea 
                    value={formData.msgRechazadoLocal}
                    onChange={e => setFormData({...formData, msgRechazadoLocal: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Tuvimos un problema con tu pago..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Guía Enviada / Completado (Local)</label>
                  <textarea 
                    value={formData.msgGuiaLocal}
                    onChange={e => setFormData({...formData, msgGuiaLocal: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Aquí está tu guía: {urlGuia}"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-gray-700 bg-gray-100 px-3 py-1 inline-block rounded-lg text-sm">Destino Nacional (Otros Dptos)</h4>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pago Aprobado (Nacional)</label>
                  <textarea 
                    value={formData.msgAprobadoNacional}
                    onChange={e => setFormData({...formData, msgAprobadoNacional: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Tu pago fue aprobado y enviaremos a {destino}..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pago Rechazado (Nacional)</label>
                  <textarea 
                    value={formData.msgRechazadoNacional}
                    onChange={e => setFormData({...formData, msgRechazadoNacional: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Tuvimos un problema con tu pago..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Guía Enviada (Nacional)</label>
                  <textarea 
                    value={formData.msgGuiaNacional}
                    onChange={e => setFormData({...formData, msgGuiaNacional: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all resize-y text-sm h-24"
                    placeholder="Ej. ¡Hola {cliente}! Tu guía hacia {destino} es: {urlGuia}"
                  />
                </div>
              </div>
            </div>
          </div>
`;
  // Only inject if not already there
  if (!lines.some(l => l.includes('SECCIÓN MENSAJES WHATSAPP'))) {
    lines.splice(uiIdx, 0, whatsappUI);
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Successfully patched everything line by line, preserving TS types');
