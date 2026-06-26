const fs = require('fs');

let content = fs.readFileSync('src/app/admin/pedidos/page.tsx', 'utf-8');

// 1. Add getConfiguracion to imports
if (!content.includes('getConfiguracion')) {
  content = content.replace(
    'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";',
    'import { getVentas, updateEstadoVenta, toggleEmpaquetado, subirGuiaEnvio, deleteVenta } from "@/app/actions/ventas";\nimport { getConfiguracion } from "@/app/actions/config";'
  );
}

// 2. Add config state inside AdminDashboard
if (!content.includes('const [config, setConfig] = useState<any>({});')) {
  content = content.replace(
    'const [pedidoACompletar, setPedidoACompletar] = useState<any>(null);',
    'const [pedidoACompletar, setPedidoACompletar] = useState<any>(null);\n  const [config, setConfig] = useState<any>({});'
  );
}

// 3. Update fetchPedidos or add useEffect to fetch config
// In AdminDashboard, there's a fetchPedidos. I'll add fetching config there or on mount.
if (!content.includes('const resConf = await getConfiguracion();')) {
  content = content.replace(
    'const fetchPedidos = async () => {',
    `const fetchPedidos = async () => {
    const resConf = await getConfiguracion();
    if (resConf.success) setConfig(resConf.data);`
  );
}

// 4. Helper function to generate message
const msgHelper = `
  const getWhatsAppMessage = (tipo, pedido) => {
    let template = "";
    const isLocal = pedido.destino && pedido.destino.toUpperCase() === 'LA PAZ';
    if (tipo === 'APROBADO') {
      template = isLocal 
        ? (config?.msgAprobadoLocal || "¡Hola {cliente}! Somos BrunaShop2 ✨. Tu pago por Bs. {total} ha sido VERIFICADO exitosamente ✅. Tu pedido ya está en preparación para ser enviado a la terminal de {destino}. Te avisaremos apenas lo despachemos. ¡Gracias por tu compra!")
        : (config?.msgAprobadoNacional || "¡Hola {cliente}! Somos BrunaShop2 ✨. Tu pago por Bs. {total} ha sido VERIFICADO exitosamente ✅. Tu pedido ya está en preparación para ser enviado a la terminal de {destino}. Te avisaremos apenas lo despachemos. ¡Gracias por tu compra!");
    } else if (tipo === 'RECHAZADO') {
      template = isLocal
        ? (config?.msgRechazadoLocal || "¡Hola {cliente}! Somos BrunaShop2. Tuvimos un inconveniente al verificar tu comprobante de pago por Bs. {total} ❌. Por favor, ¿podrías enviarnos la imagen del comprobante por este medio para revisar qué pasó? Quedamos atentas.")
        : (config?.msgRechazadoNacional || "¡Hola {cliente}! Somos BrunaShop2. Tuvimos un inconveniente al verificar tu comprobante de pago por Bs. {total} ❌. Por favor, ¿podrías enviarnos la imagen del comprobante por este medio para revisar qué pasó? Quedamos atentas.");
    } else if (tipo === 'GUIA') {
      template = isLocal
        ? (config?.msgGuiaLocal || "¡Hola {cliente}! 😊 Tu pedido de BrunaShop ya fue enviado.\\n\\nEl siguiente enlace abrirá la imagen o foto de tu guía de envío para que puedas recogerlo:\\n{urlGuia}\\n\\n¡Gracias por tu preferencia!")
        : (config?.msgGuiaNacional || "¡Hola {cliente}! 😊 Tu pedido de BrunaShop ya fue enviado.\\n\\nEl siguiente enlace abrirá la imagen o foto de tu guía de envío para que puedas recogerlo:\\n{urlGuia}\\n\\n¡Gracias por tu preferencia!");
    }

    return template
      .replace(/{cliente}/g, pedido.cliente || '')
      .replace(/{total}/g, pedido.total ? pedido.total.toFixed(2) : '')
      .replace(/{destino}/g, pedido.destino || 'tu ciudad')
      .replace(/{urlGuia}/g, pedido.guiaEnvioUrl || '');
  };
`;

if (!content.includes('const getWhatsAppMessage')) {
  content = content.replace(
    'const aprobarPago = async (pedido: any) => {',
    msgHelper + '\n  const aprobarPago = async (pedido: any) => {'
  );
}

// 5. Replace hardcoded messages in aprobarPago
content = content.replace(
  'const mensaje = `¡Hola ${pedido.cliente}! Somos BrunaShop2 ✨. Tu pago por Bs. ${pedido.total.toFixed(2)} ha sido VERIFICADO exitosamente ✅. Tu pedido ya está en preparación para ser enviado a la terminal de ${pedido.destino}. Te avisaremos apenas lo despachemos. ¡Gracias por tu compra!`;',
  'const mensaje = getWhatsAppMessage("APROBADO", pedido);'
);

// 6. Replace hardcoded messages in rechazarPago
content = content.replace(
  'const mensaje = `¡Hola ${pedido.cliente}! Somos BrunaShop2. Tuvimos un inconveniente al verificar tu comprobante de pago por Bs. ${pedido.total.toFixed(2)} ❌. Por favor, ¿podrías enviarnos la imagen del comprobante por este medio para revisar qué pasó? Quedamos atentas.`;',
  'const mensaje = getWhatsAppMessage("RECHAZADO", pedido);'
);

// 7. Add Resend WhatsApp button for Empaquetar and Rechazados
const resendBtnHtml = `
                    {(pedido.estado === 'Aprobado' || pedido.estado === 'PREPARANDO') && filtroTab === 'empaquetar' && (
                      <button 
                        onClick={() => enviarWhatsApp(pedido.celular, getWhatsAppMessage('APROBADO', pedido))}
                        className="px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Reenviar Mensaje WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" /> Reenviar Msg
                      </button>
                    )}
                    {pedido.estado === 'Rechazado' && filtroTab === 'rechazados' && (
                      <button 
                        onClick={() => enviarWhatsApp(pedido.celular, getWhatsAppMessage('RECHAZADO', pedido))}
                        className="px-3 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#1da851] transition-colors shadow-md flex items-center gap-2 font-bold text-xs"
                        title="Reenviar Mensaje WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" /> Reenviar Msg
                      </button>
                    )}
`;

content = content.replace(
  '{pedido.terminosAceptados && (',
  resendBtnHtml + '\n                    {pedido.terminosAceptados && ('
);

// 8. Replace hardcoded messages in sending Guide
content = content.replace(
  'const mensaje = `¡Hola ${pedido.cliente}! 😊 Tu pedido de BrunaShop ya fue enviado.\\n\\nEl siguiente enlace abrirá la imagen o foto de tu guía de envío para que puedas recogerlo:\\n${pedido.guiaEnvioUrl}\\n\\n¡Gracias por tu preferencia!`;',
  'const mensaje = getWhatsAppMessage("GUIA", pedido);'
);

// 9. There's another place around line 828 where it directly calls enviarWhatsapp inside a button onClick
content = content.replace(
  'enviarWhatsApp(pedido.celular, `¡Hola ${pedido.cliente}! 😊 Tu pedido de BrunaShop ya fue enviado.\\n\\nEl siguiente enlace abrirá la imagen o foto de tu guía de envío para que puedas recogerlo:\\n${pedido.guiaEnvioUrl}`)',
  'enviarWhatsApp(pedido.celular, getWhatsAppMessage("GUIA", pedido))'
);

fs.writeFileSync('src/app/admin/pedidos/page.tsx', content);
console.log('patched pedidos/page.tsx');
