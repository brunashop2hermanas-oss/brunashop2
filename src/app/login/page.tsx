"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Lock, X } from "lucide-react";
import { loginUser, resetPassword } from "@/app/actions/auth";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Reset Password State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUsername, setResetUsername] = useState("");
  const [resetCi, setResetCi] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const res = await loginUser(username, pin);
    if (res.success) {
      router.push("/admin");
    } else {
      setError(res.error || "Credenciales incorrectas. Intente nuevamente.");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    const res = await resetPassword(resetUsername, resetCi, resetNewPin);
    if (res.success) {
      setResetSuccess("Contraseña cambiada exitosamente. Ahora puedes ingresar.");
      setResetUsername("");
      setResetCi("");
      setResetNewPin("");
    } else {
      setResetError(res.error || "Error al cambiar la contraseña.");
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row relative">
      
      {/* Sección Izquierda: Imagen */}
      <div className="w-full md:w-1/2 h-64 md:h-screen relative">
        <img 
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop" 
          alt="BrunaShop Admin" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-8">
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2 tracking-wide">Acceso Restringido</h2>
          <p className="text-white/80 text-sm tracking-widest uppercase">Panel de Administración</p>
        </div>
      </div>

      {/* Sección Derecha: Formulario */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 lg:p-24 bg-[#fcfcfc] min-h-[calc(100vh-16rem)] md:min-h-screen">
        <div className="w-full max-w-sm">
          
          <div className="text-left mb-12">
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.png" alt="BrunaShop Logo" className="w-12 h-12 object-cover rounded-full shadow-sm" />
              <h1 className="text-2xl font-extrabold tracking-tighter text-black">
                Bruna<span className="text-gray-400">Shop</span>
              </h1>
            </div>
            <h2 className="text-2xl font-serif text-black mb-2">Bienvenida de nuevo</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Ingrese sus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 text-[10px] p-4 text-center uppercase tracking-widest border-l-4 border-red-600 font-bold">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold ml-1">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white border border-gray-200 py-4 px-4 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all rounded-sm"
                placeholder="ej: admin"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Contraseña / PIN</label>
                <button type="button" onClick={() => setShowResetModal(true)} className="text-[10px] text-gray-400 hover:text-black transition-colors uppercase tracking-widest">
                  ¿Olvidó su contraseña?
                </button>
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-white border border-gray-200 py-4 px-4 text-sm text-black placeholder-gray-300 focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all rounded-sm"
                placeholder="****"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-xs uppercase tracking-widest font-bold py-4 mt-8 hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 rounded-sm shadow-md hover:shadow-xl disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar al Sistema"} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-16 text-center">
            <Link href="/" className="text-[10px] text-gray-400 hover:text-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
              &larr; Volver a la tienda
            </Link>
          </div>
        </div>
      </div>

      {/* Modal para cambiar/restablecer contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-sm p-8 relative shadow-2xl">
            <button onClick={() => setShowResetModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-serif mb-2">Restablecer Contraseña</h3>
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest">Por seguridad, valide su identidad</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && <div className="bg-red-50 text-red-600 text-[10px] p-3 text-center uppercase tracking-widest border-l-4 border-red-600 font-bold">{resetError}</div>}
              {resetSuccess && <div className="bg-green-50 text-green-700 text-[10px] p-3 text-center uppercase tracking-widest border-l-4 border-green-600 font-bold">{resetSuccess}</div>}

              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Usuario</label>
                <input required type="text" value={resetUsername} onChange={e=>setResetUsername(e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-3 text-sm focus:border-black focus:outline-none" placeholder="ej: bruna" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Carnet de Identidad (C.I.)</label>
                <input required type="text" value={resetCi} onChange={e=>setResetCi(e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-3 text-sm focus:border-black focus:outline-none" placeholder="Ej: 1234567" />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nueva Contraseña / PIN</label>
                <input required type="password" value={resetNewPin} onChange={e=>setResetNewPin(e.target.value)} className="w-full bg-white border border-gray-200 py-3 px-3 text-sm focus:border-black focus:outline-none" placeholder="Nuevo PIN" />
              </div>

              <button type="submit" disabled={resetLoading} className="w-full bg-black text-white text-xs uppercase tracking-widest font-bold py-3 mt-4 hover:bg-gray-800 disabled:opacity-50">
                {resetLoading ? "Procesando..." : "Cambiar Contraseña"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
