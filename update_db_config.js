const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateConfig() {
  await prisma.configuracion.updateMany({
    data: {
      msgAprobadoLocal: '¡Hola {cliente}! 🌸 Tu pago por {total} Bs ha sido recibido con éxito y tu pedido está confirmado ✅. \n\nTe avisaremos en cuanto tu paquete esté en camino o listo para entrega en La Paz. ¡Gracias por elegir Bruna Shop! 💖🛍️',
      msgAprobadoNacional: '¡Hola {cliente}! 🌸 Tu pago por {total} Bs ha sido recibido con éxito y tu pedido está confirmado ✅. \n\nEstamos preparando tu envío hacia {destino}. Te avisaremos en cuanto esté en camino. ¡Gracias por elegir Bruna Shop! 💖🛍️',
      msgRechazadoLocal: 'Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌ \n\nPor favor, contáctanos a la brevedad para resolverlo y poder procesar tu pedido. ¡Gracias! 💬',
      msgRechazadoNacional: 'Hola {cliente}. Te informamos que hemos tenido un inconveniente al verificar tu pago por {total} Bs. ❌ \n\nPor favor, contáctanos a la brevedad para resolverlo y poder procesar tu pedido. ¡Gracias! 💬',
      msgGuiaLocal: '¡Hola {cliente}! 🌸 Tu paquete ya está listo y completado. \n\nPuedes hacer seguimiento o ver los detalles aquí: {urlGuia}\n\n¡Gracias por tu compra! 💖🛍️',
      msgGuiaNacional: '¡Hola {cliente}! 🌸 Tu paquete ya está en camino hacia {destino}. 🚚\n\nAquí tienes el enlace para ver tu guía de envío y hacer seguimiento: {urlGuia}\n\n¡Gracias por tu compra! 💖🛍️'
    }
  });
  console.log('Database configuration updated with default messages!');
}
updateConfig().catch(console.error).finally(() => prisma.$disconnect());
