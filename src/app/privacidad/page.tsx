import { getConfiguracion } from "@/app/actions/config";
import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad | BrunaShop",
};

export default async function PrivacidadPage() {
  const configRes = await getConfiguracion();
  
  // Si el administrador ha configurado su propia política, la mostramos. 
  // Si no, mostramos un texto por defecto adaptado al contexto boliviano.
  const politicaGuardada = configRes.data?.politicaPrivacidad;
  const politicaPorDefecto = `POLÍTICA DE PRIVACIDAD Y TRATAMIENTO DE DATOS PERSONALES

En BrunaShop2 valoramos tu privacidad y nos comprometemos a proteger tus datos personales, conforme a los principios establecidos en la Constitución Política del Estado Plurinacional de Bolivia (Art. 21.2) y la Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación) referente al comercio electrónico.

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
- Verificar la autenticidad de los pagos realizados mediante lectura manual o automatizada (OCR / Inteligencia Artificial) de los comprobantes subidos.
- Fines de contabilidad interna, registro de clientas y resguardo legal ante posibles desconocimientos de compra.

3. USO DE IMÁGENES Y COMPROBANTES
Al subir una imagen de un comprobante de pago, aceptas que la misma pueda ser procesada por sistemas automatizados de terceros de manera segura y temporal, con el único fin de extraer la información necesaria (monto, nombre, número de referencia) para validar tu pago con agilidad. No utilizamos estas imágenes para entrenar modelos de Inteligencia Artificial ni las compartimos con terceros para fines publicitarios. Las imágenes se eliminarán periódicamente de nuestros servidores una vez que el pedido haya concluido exitosamente y expirado el plazo de reclamo.

4. USO DE COOKIES
Nuestro sistema utiliza "Cookies Esenciales" y almacenamiento local (Local Storage) exclusivamente para funciones operativas básicas, como mantener los productos guardados en tu carrito de compras mientras navegas por la tienda y recordar tu sesión si ya eres clienta recurrente. No utilizamos cookies de rastreo invasivas de terceros ni vendemos tu historial de navegación. Al utilizar nuestra tienda, aceptas el uso de estas cookies estrictamente necesarias para el funcionamiento del sistema.

5. SEGURIDAD Y CONFIDENCIALIDAD
BrunaShop no venderá, alquilará ni compartirá tus datos personales con terceros externos a nuestra logística, salvo obligación legal o requerimiento de autoridad competente en Bolivia. 

6. TUS DERECHOS
Como usuario, tienes derecho a solicitar la modificación o eliminación de tus datos personales de nuestra base de datos. Para ejercer este derecho, puedes contactarnos directamente mediante nuestro canal de atención al cliente.

Al continuar usando nuestros servicios y finalizar una compra, otorgas tu consentimiento explícito para el tratamiento de tus datos conforme a esta política.`;

  const textoAMostrar = politicaGuardada || politicaPorDefecto;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black font-serif text-black tracking-tight mb-10">Política de Privacidad</h1>
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
        <div className="whitespace-pre-wrap text-gray-600 leading-relaxed text-sm md:text-base font-medium">
          {textoAMostrar}
        </div>
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
          &larr; Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
