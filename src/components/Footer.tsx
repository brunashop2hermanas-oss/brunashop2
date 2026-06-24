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
            {config?.footerDescripcion || "Moda femenina seleccionada para resaltar tu estilo único. Alta costura al alcance de tus manos."}
          </p>
        </div>

        {/* Links */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500">Enlaces Rápidos</h3>
          <ul className="space-y-2 text-sm text-gray-300 font-light">
            <li><a href="#" className="hover:text-white transition-colors">Mujer</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Ofertas / Sale</a></li>
            <li><a href="/terminos" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
            <li><a href="/politicas" className="hover:text-white transition-colors">Políticas de Envío</a></li>
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

            {config?.facebookUrl ? (
              <a href={config.facebookUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            ) : null}

            {config?.whatsappUrl ? (
              <a href={config.whatsappUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </a>
            ) : null}
            
            {/* Fallback si no hay nada configurado */}
            {!config?.instagramUrl && !config?.tiktokUrl && !config?.facebookUrl && !config?.whatsappUrl && (
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
