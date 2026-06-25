"use client";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      className="fixed bottom-24 md:bottom-10 right-6 md:right-10 bg-black text-white px-6 py-4 rounded-full shadow-2xl font-bold flex items-center gap-3 hover:bg-gray-800 transition-colors print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="w-6 h-6" /> Imprimir a PDF
    </button>
  );
}
