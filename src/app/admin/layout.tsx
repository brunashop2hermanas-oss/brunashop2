import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";

export const metadata: Metadata = {
  title: "BrunaShop - Panel Administrador",
  manifest: "/manifest.json?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AdminShop",
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans print:min-h-0 print:bg-white">
      <AdminSidebar />
      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-10 relative overflow-y-auto overflow-x-hidden w-full print:overflow-visible print:p-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
