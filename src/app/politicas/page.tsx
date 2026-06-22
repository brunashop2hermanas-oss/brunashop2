import { getConfiguracion } from "@/app/actions/config";

export const metadata = {
  title: "Políticas de Envío | BrunaShop",
};

export default async function PoliticasPage() {
  const configRes = await getConfiguracion();
  
  const ENVIO_POR_DEFECTO = `POLÍTICAS DE ENVÍO

1. Los envíos se realizan únicamente a los departamentos y provincias habilitados en el sistema.
2. El costo del envío será asumido por el cliente al momento de recoger el paquete, a menos que se indique lo contrario en alguna promoción.
3. BrunaShop2 enviará el paquete una vez que se haya validado el pago en nuestro sistema.`;

  const politicas = configRes.data?.politicasEnvio || ENVIO_POR_DEFECTO;

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black font-serif text-black tracking-tight mb-10">Políticas de Envío</h1>
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
        <div className="whitespace-pre-wrap text-gray-600 leading-relaxed text-lg font-medium">
          {politicas}
        </div>
      </div>
    </div>
  );
}
