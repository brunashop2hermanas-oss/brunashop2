"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, User, Key, ShieldCheck, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<"login" | "recuperacion">("login");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState("");

  // Estados para recuperación
  const [pinRecuperacion, setPinRecuperacion] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (usuario && password) {
      // Usar la Server Action para crear la cookie
      const res = await loginUser(usuario, password);
      
      if (res.success) {
        router.push("/admin");
      } else {
        setError(res.error || "Credenciales incorrectas");
      }
    }
  };

  const handleRecuperar = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinRecuperacion === "1234") { // Mock PIN
      alert("¡Contraseña restablecida con éxito! Ya puedes iniciar sesión con tu nueva contraseña.");
      setPaso("login");
      setPassword("");
      setNuevaPassword("");
    } else {
      alert("El PIN Maestro es incorrecto.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo Decorativo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-6 relative">
            <img 
              src="/logo.png" 
              alt="BrunaShop2" 
              className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-brand-primary/30" 
              style={{ clipPath: "circle(50%)" }}
            />
          </div>
          <h1 className="text-3xl font-black text-foreground text-center tracking-tighter uppercase">
            Acceso Privado
          </h1>
          <p className="text-foreground/60 font-medium text-sm mt-2 uppercase tracking-widest">
            Solo Personal Autorizado
          </p>
        </div>

        <AnimatePresence mode="wait">
          {paso === "login" ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass p-8 rounded-3xl border border-surface-border shadow-3d"
            >
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="text" 
                      required
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="Ej: BrunaAdmin"
                      className="w-full bg-background border border-surface-border pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-surface-border pl-12 pr-12 py-4 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setPaso("recuperacion")}
                    className="text-sm font-bold text-brand-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {error && (
                  <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm font-bold text-center border border-red-500/20">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="w-full bg-foreground text-background py-4 rounded-xl font-black text-lg shadow-lg hover:bg-brand-primary hover:text-white transition-all flex justify-center items-center gap-2"
                >
                  Entrar al Panel <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div 
              key="recuperacion"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="glass p-8 rounded-3xl border border-surface-border shadow-3d"
            >
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="bg-brand-primary/10 p-3 rounded-full text-brand-primary mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Recuperar Acceso</h2>
                <p className="text-sm text-foreground/70">
                  Ingresa tu PIN Personal de Seguridad para establecer una nueva contraseña. Sin correos.
                </p>
              </div>

              <form onSubmit={handleRecuperar} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">PIN Personal</label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="password" 
                      required
                      value={pinRecuperacion}
                      onChange={(e) => setPinRecuperacion(e.target.value)}
                      placeholder="Ej: 1234"
                      className="w-full bg-background border border-surface-border pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold tracking-widest text-center transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Nueva Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input 
                      type="password" 
                      required
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Escribe tu nueva contraseña"
                      className="w-full bg-background border border-surface-border pl-12 pr-4 py-4 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none text-foreground font-bold transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setPaso("login")}
                    className="w-1/3 bg-surface border border-surface-border text-foreground py-4 rounded-xl font-bold hover:bg-surface-border transition-all flex justify-center items-center"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit" 
                    className="w-2/3 bg-brand-primary text-white py-4 rounded-xl font-black shadow-lg hover:brightness-110 transition-all"
                  >
                    Restablecer
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 text-center">
          <Link href="/">
            <button className="text-foreground/50 font-bold text-sm hover:text-foreground flex items-center justify-center gap-2 w-full">
              <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
            </button>
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
