const fs = require('fs');
let file = 'src/app/admin/configuracion/page.tsx';
let text = fs.readFileSync(file, 'utf-8');

// 1. Move UI
const startMarker = '{/* SECCIÓN MENSAJES WHATSAPP */}';
const endMarker = '{/* MODAL DE CONFIRMACION PARA GUARDAR */}';
const startIndex = text.indexOf(startMarker);
const endIndex = text.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
    const whatsappSection = text.slice(startIndex, endIndex);
    text = text.replace(whatsappSection, ''); // remove it from bottom
    
    // insert before Envios y Reservas
    const enviosMarker = '{/* Env';
    const enviosIdx = text.indexOf('          {/* Env');
    
    if (enviosIdx !== -1) {
        text = text.slice(0, enviosIdx) + whatsappSection + text.slice(enviosIdx);
    } else {
        console.error('Could not find Envios marker');
    }
} else {
    console.error('Could not find WhatsApp section');
}

text = text.replace(
    /msgAprobadoLocal: resConfig\.data\.msgAprobadoLocal \|\| ""/g, 
    `msgAprobadoLocal: resConfig.data.msgAprobadoLocal || "¡Hola {cliente}! 🌸 Tu pago por {total} Bs ha sido recibido con éxito y tu pedido está confirmado ✅. \\n\\nTe avisaremos en cuanto tu paquete esté en camino o listo para entrega en La Paz. ¡Gracias por elegir Bruna Shop! 💖🛍️"`
);
text = text.replace(
    /msgAprobadoNacional: resConfig\.data\.msgAprobadoNacional \|\| ""/g, 
    `msgAprobadoNacional: resConfig.data.msgAprobadoNacional || "¡Hola {cliente}! 🌸 Tu pago por {total} Bs ha sido recibido con éxito y tu pedido está confirmado ✅. \\n\\nEstamos preparando tu envío hacia {destino}. Te avisaremos en cuanto esté en camino. ¡Gracias por elegir Bruna Shop! 💖🛍️"`
);
text = text.replace(
    /msgRechazadoLocal: resConfig\.data\.msgRechazadoLocal \|\| ""/g, 
    `msgRechazadoLocal: resConfig.data.msgRechazadoLocal || "Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌ \\n\\nPor favor, contáctanos a la brevedad para resolverlo y poder procesar tu pedido. ¡Gracias! 💬"`
);
text = text.replace(
    /msgRechazadoNacional: resConfig\.data\.msgRechazadoNacional \|\| ""/g, 
    `msgRechazadoNacional: resConfig.data.msgRechazadoNacional || "Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌ \\n\\nPor favor, contáctanos a la brevedad para resolverlo y poder procesar tu pedido. ¡Gracias! 💬"`
);
text = text.replace(
    /msgGuiaLocal: resConfig\.data\.msgGuiaLocal \|\| ""/g, 
    `msgGuiaLocal: resConfig.data.msgGuiaLocal || "¡Hola {cliente}! 🌸 Tu paquete ya está listo y completado. \\n\\nPuedes hacer seguimiento o ver los detalles aquí: {urlGuia}\\n\\n¡Gracias por tu compra! 💖🛍️"`
);
text = text.replace(
    /msgGuiaNacional: resConfig\.data\.msgGuiaNacional \|\| ""/g, 
    `msgGuiaNacional: resConfig.data.msgGuiaNacional || "¡Hola {cliente}! 🌸 Tu paquete ya está en camino hacia {destino}. 🚚\\n\\nAquí tienes el enlace para ver tu guía de envío y hacer seguimiento: {urlGuia}\\n\\n¡Gracias por tu compra! 💖🛍️"`
);

fs.writeFileSync(file, text);
console.log('Moved section and added default messages');
