const fs = require('fs');
let content = fs.readFileSync('src/app/admin/configuracion/page.tsx', 'utf-8');

if (!content.includes('msgAprobadoLocal: ""')) {
  content = content.replace(
    'categoriasPrendas: [',
    `msgAprobadoLocal: "",
    msgAprobadoNacional: "",
    msgRechazadoLocal: "",
    msgRechazadoNacional: "",
    msgGuiaLocal: "",
    msgGuiaNacional: "",
    categoriasPrendas: [`
  );
}

if (!content.includes('msgAprobadoLocal: data.msgAprobadoLocal || ""')) {
  content = content.replace(
    'categoriasPrendas: data.categoriasPrendas || [',
    `msgAprobadoLocal: data.msgAprobadoLocal || "",
          msgAprobadoNacional: data.msgAprobadoNacional || "",
          msgRechazadoLocal: data.msgRechazadoLocal || "",
          msgRechazadoNacional: data.msgRechazadoNacional || "",
          msgGuiaLocal: data.msgGuiaLocal || "",
          msgGuiaNacional: data.msgGuiaNacional || "",
          categoriasPrendas: data.categoriasPrendas || [`
  );
}

fs.writeFileSync('src/app/admin/configuracion/page.tsx', content);
console.log('patched formData states');
