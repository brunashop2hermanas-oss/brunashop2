import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const config = await prisma.configuracion.findFirst();
  if (config) {
    const nuevaPolitica = `En BrunaShop2 valoramos tu privacidad y nos comprometemos a proteger tus datos personales, conforme a los principios establecidos en la Constitución Política del Estado Plurinacional de Bolivia (Art. 21.2) y la Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación) referente al comercio electrónico.

1. DATOS QUE RECOPILAMOS
Para procesar tus pedidos, recopilamos la siguiente información:
- Nombres y Apellidos.
- Cédula de Identidad (C.I.).
- Número de teléfono / celular (WhatsApp).
- Información de envío (Departamento y Provincia).
- Imágenes de comprobantes de transferencia bancaria o depósitos (cuando aplique).
- Dirección IP y marca de tiempo (fecha y hora exacta) al momento de aceptar los términos, con fines de seguridad y validación legal (Firma Electrónica/Clickwrap).

2. FINALIDAD DEL TRATAMIENTO DE DATOS
Los datos proporcionados serán utilizados única y exclusivamente para:
- Procesar, confirmar y enviar tu pedido.
- Contactarte mediante WhatsApp para actualizar el estado de tu compra.
- Verificar la autenticidad de los pagos realizados mediante lectura manual de los comprobantes subidos.
- Fines de contabilidad interna, registro de clientas y resguardo legal ante posibles desconocimientos de compra.

3. SEGURIDAD Y CONFIDENCIALIDAD
BrunaShop no venderá, alquilará ni compartirá tus datos personales con terceros externos a nuestra logística, salvo obligación legal o requerimiento de autoridad competente en Bolivia. 

4. TUS DERECHOS
Como usuario, tienes derecho a solicitar la modificación o eliminación de tus datos personales de nuestra base de datos. Para ejercer este derecho, puedes contactarnos directamente mediante nuestro canal de atención al cliente.

Al continuar usando nuestros servicios y finalizar una compra, otorgas tu consentimiento explícito para el tratamiento de tus datos conforme a esta política.`;

    const nuevosTerminos = `Al utilizar el sistema de BrunaShop2 y completar una compra, declaras estar de acuerdo con las siguientes condiciones:
1. Todo pedido realizado a través de la web requiere la carga del comprobante de pago dentro del tiempo de reserva estipulado.
2. Si no se sube el comprobante a tiempo, el sistema liberará automáticamente el stock reservado.
3. El usuario acepta los términos de envíos y políticas de reembolso vigentes al momento de la compra.`;

    await prisma.configuracion.update({
      where: { id: config.id },
      data: { 
        politicaPrivacidad: nuevaPolitica,
        terminosCondiciones: nuevosTerminos
      }
    });
    console.log("Configuración actualizada correctamente");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
