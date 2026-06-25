import { getVenta } from "@/app/actions/ventas";
import { getConfiguracion } from "@/app/actions/config";
import { ShieldCheck, CalendarClock, Fingerprint, MapPin, MonitorSmartphone, ScrollText } from "lucide-react";
import PrintButton from "./PrintButton";

export default async function CertificadoLegalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getVenta(id);
  const venta = res.success ? res.data : null;

  if (!venta) {
    return <div className="p-10 text-center font-bold text-red-500">Certificado no encontrado.</div>;
  }

  const configRes = await getConfiguracion();
  
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

4. SEGURIDAD Y CONFIDENCIALIDAD
BrunaShop no venderá, alquilará ni compartirá tus datos personales con terceros externos a nuestra logística, salvo obligación legal o requerimiento de autoridad competente en Bolivia. 

5. TUS DERECHOS
Como usuario, tienes derecho a solicitar la modificación o eliminación de tus datos personales de nuestra base de datos. Para ejercer este derecho, puedes contactarnos directamente mediante nuestro canal de atención al cliente.

Al continuar usando nuestros servicios y finalizar una compra, otorgas tu consentimiento explícito para el tratamiento de tus datos conforme a esta política.`;

  const politicaPrivacidad = configRes.data?.politicaPrivacidad || politicaPorDefecto;
  const terminosCondiciones = configRes.data?.terminosCondiciones || "El usuario acepta los términos de venta, envíos y reembolsos vigentes al momento de la compra.";

  const clienta = venta.clienta;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 print:py-0 print:bg-white text-black">
      <div className="w-full max-w-3xl bg-white p-12 shadow-2xl print:shadow-none print:p-0 mb-8 border border-gray-200">
        
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b-4 border-gray-900 pb-6 mb-8">
          <div>
            <h1 className="text-4xl font-black font-serif uppercase tracking-tighter">BrunaShop2</h1>
            <p className="text-gray-500 text-sm font-bold tracking-widest uppercase mt-1">Certificado de Aceptación Legal</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">ID de Transacción</p>
            <p className="font-mono text-lg font-bold text-black">{venta.id}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(venta.fecha).toLocaleString()}</p>
          </div>
        </div>

        {/* Declaración */}
        <div className="mb-10 text-justify text-gray-800 leading-relaxed text-sm">
          <p className="mb-4">
            El presente documento certifica que el usuario detallado a continuación ha expresado su consentimiento explícito, inequívoco e informado respecto a los <strong>Términos y Condiciones</strong> y la <strong>Política de Privacidad y Tratamiento de Datos Personales</strong> de la plataforma BrunaShop2.
          </p>
          <p>
            Esta aceptación se ha registrado mediante un mecanismo electrónico de tipo <em>Clickwrap</em> durante el proceso de validación de compra (checkout). La siguiente información técnica y transaccional sirve como prueba fehaciente (Firma Electrónica) de dicha aceptación, conforme al marco legal aplicable y las normativas de comercio electrónico en el Estado Plurinacional de Bolivia.
          </p>
        </div>

        {/* Datos de Prueba Legal */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-8">
          <h2 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" /> Huella Digital de Aceptación
          </h2>
          
          <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><CalendarClock className="w-4 h-4"/> Timestamp (Hora Exacta)</p>
              <p className="font-mono font-bold text-black text-base mt-1">
                {venta.fechaAceptacion ? new Date(venta.fechaAceptacion).toLocaleString() : 'No registrada'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><MonitorSmartphone className="w-4 h-4"/> Dirección IP de Origen</p>
              <p className="font-mono font-bold text-black text-base mt-1">
                {venta.ipAceptacion || 'No registrada'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Fingerprint className="w-4 h-4"/> Estado Legal</p>
              <p className="font-bold text-green-600 flex items-center gap-1 text-base mt-1">
                {venta.terminosAceptados ? "ACEPTADO VÁLIDO ✅" : "PENDIENTE ❌"}
              </p>
            </div>
          </div>
        </div>

        {/* Datos del Cliente y Pedido */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">Identificación del Usuario</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li><strong>Nombre:</strong> {clienta?.nombres} {clienta?.apellidos}</li>
              <li><strong>Carnet de Identidad:</strong> {clienta?.ci || 'No provisto'}</li>
              <li><strong>Celular verificado:</strong> {clienta?.celular}</li>
              <li><strong>Destino de Envío:</strong> {venta.destino}</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">Detalle de la Operación</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li><strong>Monto Total:</strong> Bs. {venta.total.toFixed(2)}</li>
              <li><strong>Método de Pago:</strong> {venta.metodoPago}</li>
              <li><strong>Nombre en Comprobante:</strong> {venta.depositanteNombres} {venta.depositanteApPaterno} {venta.depositanteApMaterno}</li>
            </ul>
          </div>
        </div>

        {/* Comprobante Adjunto (si existe) */}
        {venta.comprobante && (
          <div className="mb-10 break-inside-avoid">
            <h3 className="font-bold text-gray-900 mb-3 border-b border-gray-200 pb-1">Comprobante Bancario Asociado</h3>
            <div className="border border-gray-200 p-2 bg-gray-50 inline-block rounded-md">
              <img src={venta.comprobante} alt="Comprobante de Pago" className="max-w-full h-auto max-h-80 print:max-h-52 object-contain" />
            </div>
          </div>
        )}

        {/* Anexo de Textos Legales Aceptados */}
        <div className="mb-10 pt-6">
          <h3 className="text-lg font-black uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
            <ScrollText className="w-5 h-5 text-gray-700" /> Anexo: Textos Legales Aceptados
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            El siguiente texto representa la versión exacta de las políticas vigentes al momento en que el usuario otorgó su consentimiento.
          </p>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none">
            {configRes.data?.identidadTienda && (
              <>
                <strong className="text-gray-900 uppercase block mb-2 text-sm">Identidad Legal:</strong>
                <div dangerouslySetInnerHTML={{ __html: configRes.data.identidadTienda }} />
                <div className="my-6 border-b border-gray-300" />
              </>
            )}
            {configRes.data?.terminosCondiciones && (
              <>
                <strong className="text-gray-900 uppercase block mb-2 text-sm">Términos y Condiciones:</strong>
                <div dangerouslySetInnerHTML={{ __html: terminosCondiciones }} />
                <div className="my-6 border-b border-gray-300" />
              </>
            )}
            {configRes.data?.politicasEnvio && (
              <>
                <strong className="text-gray-900 uppercase block mb-2 text-sm">Políticas de Envío:</strong>
                <div dangerouslySetInnerHTML={{ __html: configRes.data.politicasEnvio }} />
                <div className="my-6 border-b border-gray-300" />
              </>
            )}
            {configRes.data?.politicaDevoluciones && (
              <>
                <strong className="text-gray-900 uppercase block mb-2 text-sm">Políticas de Devoluciones:</strong>
                <div dangerouslySetInnerHTML={{ __html: configRes.data.politicaDevoluciones }} />
                <div className="my-6 border-b border-gray-300" />
              </>
            )}
            {configRes.data?.jurisdiccion && (
              <>
                <strong className="text-gray-900 uppercase block mb-2 text-sm">Jurisdicción de Disputas:</strong>
                <div dangerouslySetInnerHTML={{ __html: configRes.data.jurisdiccion }} />
                <div className="my-6 border-b border-gray-300" />
              </>
            )}
            <strong className="text-gray-900 uppercase block mb-2 text-sm">Política de Privacidad y Tratamiento de Datos:</strong>
            <div dangerouslySetInnerHTML={{ __html: politicaPrivacidad }} />
          </div>
        </div>

        {/* Footer Legal */}
        <div className="border-t border-gray-200 pt-6 mt-12 text-xs text-gray-400 text-center uppercase tracking-widest font-bold">
          Documento digital autogenerado inalterable • Plataforma BrunaShop2
        </div>
      </div>

      <PrintButton />
    </div>
  );
}
