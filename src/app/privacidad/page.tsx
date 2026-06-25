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
  const politicaPorDefecto = `<p>En BrunaShop2 valoramos tu privacidad y nos comprometemos a proteger tus datos personales, conforme a los principios establecidos en la Constitución Política del Estado Plurinacional de Bolivia (Art. 21.2) y la Ley N° 164 (Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación) referente al comercio electrónico.</p>
<p><strong>1. DATOS QUE RECOPILAMOS</strong><br/>
Para procesar tus pedidos, recopilamos la siguiente información:</p>
<ul>
  <li>Nombres y Apellidos.</li>
  <li>Cédula de Identidad (C.I.).</li>
  <li>Número de teléfono / celular (WhatsApp).</li>
  <li>Información de envío (Departamento y Provincia).</li>
  <li>Imágenes de comprobantes de transferencia bancaria o depósitos (cuando aplique).</li>
  <li>Dirección IP y marca de tiempo (fecha y hora exacta) al momento de aceptar los términos, con fines de seguridad y validación legal (Firma Electrónica/Clickwrap).</li>
</ul>
<p><strong>2. FINALIDAD DEL TRATAMIENTO DE DATOS</strong><br/>
Los datos proporcionados serán utilizados única y exclusivamente para:</p>
<ul>
  <li>Procesar, confirmar y enviar tu pedido.</li>
  <li>Contactarte mediante WhatsApp para actualizar el estado de tu compra.</li>
  <li>Verificar la autenticidad de los pagos realizados mediante revisión manual de los comprobantes subidos.</li>
  <li>Fines de contabilidad interna, registro de clientas y resguardo legal ante posibles desconocimientos de compra.</li>
</ul>
<p><strong>3. USO DE IMÁGENES Y COMPROBANTES</strong><br/>
Al subir una imagen de un comprobante de pago, aceptas que la misma será procesada y almacenada de manera segura, con el único fin de extraer la información necesaria (monto, nombre, número de referencia) para validar tu pago con agilidad. Las imágenes se eliminarán periódicamente de nuestros servidores una vez que el pedido haya concluido exitosamente y expirado el plazo de reclamo.</p>
<p><strong>4. USO DE COOKIES</strong><br/>
Nuestro sistema utiliza "Cookies Esenciales" y almacenamiento local (Local Storage) exclusivamente para funciones operativas básicas, como mantener los productos guardados en tu carrito de compras mientras navegas por la tienda y recordar tu sesión si ya eres clienta recurrente. No utilizamos cookies de rastreo invasivas de terceros ni vendemos tu historial de navegación. Al utilizar nuestra tienda, aceptas el uso de estas cookies estrictamente necesarias para el funcionamiento del sistema.</p>
<p><strong>5. SEGURIDAD Y CONFIDENCIALIDAD</strong><br/>
BrunaShop no venderá, alquilará ni compartirá tus datos personales con terceros externos a nuestra logística, salvo obligación legal o requerimiento de autoridad competente en Bolivia.</p>
<p><strong>6. TUS DERECHOS</strong><br/>
Como usuario, tienes derecho a solicitar la modificación o eliminación de tus datos personales de nuestra base de datos. Para ejercer este derecho, puedes contactarnos directamente mediante nuestro canal de atención al cliente.</p>
<p>Al continuar usando nuestros servicios y finalizar una compra, otorgas tu consentimiento explícito para el tratamiento de tus datos conforme a esta política.</p>`;

  const textoAMostrar = politicaGuardada || politicaPorDefecto;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black font-serif text-black tracking-tight mb-10">Política de Privacidad</h1>
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
        <div 
          className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: textoAMostrar }} 
        />
      </div>
      <div className="mt-8 text-center">
        <Link href="/" className="text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
          &larr; Volver a la tienda
        </Link>
      </div>
    </div>
  );
}
