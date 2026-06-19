import { getConfiguracion } from "@/app/actions/config";

export const metadata = {
  title: "Políticas de Envío | BrunaShop",
};

export default async function PoliticasPage() {
  const configRes = await getConfiguracion();
  const politicas = configRes.data?.politicasEnvio || "Las políticas de envío se están actualizando. Vuelve pronto.";

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
