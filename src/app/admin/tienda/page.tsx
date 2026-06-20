import React from "react";

export const metadata = {
  title: "Vista de la Tienda | BrunaShop",
};

export default function VistaTiendaPage() {
  return (
    <div className="-mx-6 -my-6 md:mx-0 md:my-0 w-[calc(100%+3rem)] md:w-full h-[calc(100vh-4.5rem)] md:h-[calc(100vh-6rem)] relative overflow-hidden md:rounded-3xl shadow-none md:shadow-2xl border-y md:border border-gray-200">
      <div className="bg-gray-100 border-b border-gray-200 p-2 md:p-3 flex items-center gap-2">
        <div className="flex gap-1.5 pl-2">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="mx-auto bg-white px-6 py-1 rounded-full text-xs font-medium text-gray-500 shadow-sm">
          Vista previa del catálogo público
        </div>
      </div>
      <iframe 
        src="/" 
        className="w-full h-full border-none bg-white"
        title="Vista Pública de BrunaShop"
      />
    </div>
  );
}
