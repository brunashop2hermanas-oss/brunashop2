import { getConfiguracion } from "@/app/actions/config";

export const metadata = {
  title: "Términos y Condiciones | BrunaShop",
};

export default async function TerminosPage() {
  const configRes = await getConfiguracion();

  const TERMINOS_POR_DEFECTO = `<p>Al utilizar el sistema de BrunaShop2 y completar una compra, declaras estar de acuerdo con las siguientes condiciones:</p>
<ol>
  <li>Todo pedido realizado a través de la web requiere la carga del comprobante de pago dentro del tiempo de reserva estipulado.</li>
  <li>Si no se sube el comprobante a tiempo, el sistema liberará automáticamente el stock reservado.</li>
  <li>El usuario acepta los términos de envíos y políticas de reembolso vigentes al momento de la compra.</li>
</ol>`;

  const ENVIO_POR_DEFECTO = `<ol>
  <li>Los envíos se realizan únicamente a los departamentos y provincias habilitados en el sistema.</li>
  <li>El costo del envío será asumido por el cliente al momento de recoger el paquete, a menos que se indique lo contrario en alguna promoción.</li>
  <li>BrunaShop2 enviará el paquete una vez que se haya validado el pago en nuestro sistema.</li>
</ol>`;

  const DEVOLUCIONES_POR_DEFECTO = `<p>En cumplimiento con la normativa de defensa de los derechos del consumidor del Estado Plurinacional de Bolivia (Ley N° 453), BrunaShop2 establece las siguientes políticas:</p>
<ol>
  <li>No se aceptan devoluciones de dinero una vez confirmada la compra y enviado el producto.</li>
  <li>Únicamente se aceptarán cambios físicos del producto si este presenta defectos evidentes de fábrica demostrables al momento de recibirlo.</li>
  <li>Para cualquier solicitud de cambio, el cliente deberá comunicarse dentro de las primeras 24 horas tras la recepción del producto, conservando empaques y etiquetas originales.</li>
</ol>`;

  const IDENTIDAD_POR_DEFECTO = `<p><strong>BrunaShop2</strong><br/>
Razón Social: BrunaShop<br/>
Ubicación: La Paz, Estado Plurinacional de Bolivia.<br/>
Atención al Cliente: (Añadir número/contacto aquí)<br/>
Actividad Comercial: Venta minorista de artículos por internet.</p>`;

  const JURISDICCION_POR_DEFECTO = `<p>Para todos los efectos legales, las partes se someten a la jurisdicción de las leyes del Estado Plurinacional de Bolivia. Cualquier disputa o controversia que surja de las operaciones realizadas en esta tienda virtual será resuelta ante las autoridades administrativas y los tribunales competentes de la ciudad de La Paz, Bolivia.</p>`;

  const terminos = configRes.data?.terminosCondiciones || TERMINOS_POR_DEFECTO;
  const identidadTienda = configRes.data?.identidadTienda || IDENTIDAD_POR_DEFECTO;
  const politicasEnvio = configRes.data?.politicasEnvio || ENVIO_POR_DEFECTO;
  const politicaDevoluciones = configRes.data?.politicaDevoluciones || DEVOLUCIONES_POR_DEFECTO;
  const jurisdiccion = configRes.data?.jurisdiccion || JURISDICCION_POR_DEFECTO;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black font-serif text-black tracking-tight mb-10">Términos y Condiciones</h1>
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl space-y-8">
        {identidadTienda && (
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">Identidad Legal de la Tienda</h2>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: identidadTienda }} />
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">Términos y Condiciones Generales</h2>
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: terminos }} />
        </div>

        {politicasEnvio && (
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">Políticas de Envío</h2>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: politicasEnvio }} />
          </div>
        )}

        {politicaDevoluciones && (
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">Políticas de Cambios y Devoluciones</h2>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: politicaDevoluciones }} />
          </div>
        )}

        {jurisdiccion && (
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest text-gray-900 mb-2">Jurisdicción de Disputas</h2>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-sm text-gray-600 prose max-w-none" dangerouslySetInnerHTML={{ __html: jurisdiccion }} />
          </div>
        )}
      </div>
    </div>
  );
}
