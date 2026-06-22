import { getConfiguracion } from "@/app/actions/config";

export const metadata = {
  title: "Términos y Condiciones | BrunaShop",
};

export default async function TerminosPage() {
  const configRes = await getConfiguracion();

  const TERMINOS_POR_DEFECTO = `TÉRMINOS Y CONDICIONES DE COMPRA

Al utilizar el sistema de BrunaShop2 y completar una compra, declaras estar de acuerdo con las siguientes condiciones:
1. Todo pedido realizado a través de la web requiere la carga del comprobante de pago dentro del tiempo de reserva estipulado.
2. Si no se sube el comprobante a tiempo, el sistema liberará automáticamente el stock reservado.
3. El usuario acepta los términos de envíos y políticas de reembolso vigentes al momento de la compra.`;

  const terminos = configRes.data?.terminosCondiciones || TERMINOS_POR_DEFECTO;

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
