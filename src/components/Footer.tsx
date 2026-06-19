"use client";

import { getConfiguracion } from "@/app/actions/config";
import { useEffect, useState } from "react";

export default function Footer() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await getConfiguracion();
      if (res.success) {
        setConfig(res.data);
      }
    };
    fetchConfig();
  }, []);

  return (
    <footer className="w-full bg-black text-white py-16 px-4 md:px-12 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
        {/* Marca */}
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold tracking-tighter uppercase">BrunaShop2</h2>
          <p className="text-sm text-gray-400 font-light max-w-xs mx-auto md:mx-0">
            Moda femenina seleccionada para resaltar tu estilo único. Alta costura al alcance de tus manos.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm text-gray-300 font-light">
            <li><a href="#" className="hover:text-white transition-colors">Mujer</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Ofertas / Sale</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Políticas de Envío</a></li>
          </ul>
        </div>

        {/* Redes */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Síguenos</h3>
          <div className="flex justify-center md:justify-start gap-6">
            {config?.instagramUrl ? (
              <a href={config.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            ) : null}
            
            {config?.tiktokUrl ? (
              <a href={config.tiktokUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            ) : null}

            {config?.whatsappUrl ? (
              <a href={config.whatsappUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </a>
            ) : null}
            
            {/* Fallback si no hay nada configurado */}
            {!config?.instagramUrl && !config?.tiktokUrl && !config?.whatsappUrl && (
              <span className="text-xs text-gray-500 uppercase">Sin redes sociales configuradas</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 uppercase tracking-widest">
        <p>&copy; {new Date().getFullYear()} BrunaShop2. Todos los derechos reservados.</p>
        <p>Envíos a toda Bolivia</p>
      </div>
    </footer>
  );
}
