const fs = require('fs');
let content = fs.readFileSync('src/app/admin/configuracion/page.tsx', 'utf-8');

const badChunk = `          jurisdiccion: resConfig.data.jurisdiccion || JURISDICCION_POR_DEFECTO,
          categoriasPrendas: resConfig.data.categoriasPrendas || [
            "Vestidos", "Conjuntos", "Blusas y Tops", 
            "Pantalones y Jeans", "Chaquetas y Abrigos", 
            "Enterizos", "Ofertas / Sale"
          ],
          msgAprobadoLocal: resConfig.data.msgAprobadoLocal || "",
          msgAprobadoNacional: resConfig.data.msgAprobadoNacional || "",
          msgRechazadoLocal: resConfig.data.msgRechazadoLocal || "",
          msgRechazadoNacional: resConfig.data.msgRechazadoNacional || "",
          msgGuiaLocal: resConfig.data.msgGuiaLocal || "",
          msgGuiaNacional: resConfig.data.msgGuiaNacional || "",
            parsedDestinos[depto] = { provincias: loadedDestinos[depto] as string[], municipios: [] };`;

const goodChunk = `          jurisdiccion: resConfig.data.jurisdiccion || JURISDICCION_POR_DEFECTO,
          usarControlFinanciero: resConfig.data.usarControlFinanciero ?? true,
          liveActivo: resConfig.data.liveActivo ?? false,
          liveHorariosRecurrentes: (resConfig.data.liveHorariosRecurrentes as { horarios: { diaSemana: number, hora: string, unSoloUso?: boolean }[], ultimaActivacion: string | undefined }) || { horarios: [] },
          tiempoReservaMinutos: resConfig.data.tiempoReservaMinutos ?? 4,
          tiempoLlenadoDatosMinutos: resConfig.data.tiempoLlenadoDatosMinutos ?? 10,
          destinosHabilitados: {}, // Lo llenamos abajo
          categoriasPrendas: resConfig.data.categoriasPrendas || ["Vestidos", "Conjuntos", "Blusas y Tops", "Pantalones y Jeans", "Chaquetas y Abrigos", "Enterizos", "Ofertas / Sale"],
          msgAprobadoLocal: resConfig.data.msgAprobadoLocal || "",
          msgAprobadoNacional: resConfig.data.msgAprobadoNacional || "",
          msgRechazadoLocal: resConfig.data.msgRechazadoLocal || "",
          msgRechazadoNacional: resConfig.data.msgRechazadoNacional || "",
          msgGuiaLocal: resConfig.data.msgGuiaLocal || "",
          msgGuiaNacional: resConfig.data.msgGuiaNacional || ""
        });

        const loadedDestinos = (resConfig.data.destinosHabilitados as Record<string, unknown>) || {};
        const parsedDestinos: Record<string, { provincias: string[], municipios: string[] }> = {};
        for (const depto in loadedDestinos) {
          if (Array.isArray(loadedDestinos[depto])) {
            parsedDestinos[depto] = { provincias: loadedDestinos[depto] as string[], municipios: [] };`;

content = content.replace(badChunk, goodChunk);
fs.writeFileSync('src/app/admin/configuracion/page.tsx', content);
console.log('Restored');
