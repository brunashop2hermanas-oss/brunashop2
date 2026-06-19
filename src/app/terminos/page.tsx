import { getConfiguracion } from "@/app/actions/config";

export const metadata = {
  title: "Términos y Condiciones | BrunaShop",
};

export default async function TerminosPage() {
  const configRes = await getConfiguracion();
  const terminos = configRes.data?.terminosCondiciones || "Los términos y condiciones se están actualizando. Vuelve pronto.";

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-black font-serif text-black tracking-tight mb-10">Términos y Condiciones</h1>
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
        <div className="whitespace-pre-wrap text-gray-600 leading-relaxed text-lg font-medium">
          {terminos}
        </div>
      </div>
    </div>
  );
}
