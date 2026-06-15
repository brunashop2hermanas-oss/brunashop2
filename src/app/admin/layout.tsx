import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
  title: "BrunaShop2 - Panel Admin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AdminShop",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <AdminSidebar />
      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-10 relative overflow-y-auto">
        {/* Efecto de luz de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
