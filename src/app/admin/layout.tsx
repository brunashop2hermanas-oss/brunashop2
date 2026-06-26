import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";
import PaymentReminder from "@/components/PaymentReminder";

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
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans print:h-auto print:bg-white">
      <PaymentReminder />
      <div className="flex-1 flex flex-col md:flex-row">
        <AdminSidebar />
      {/* Contenido Principal */}
      <main className="flex-1 p-6 md:p-10 relative w-full print:p-0">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
}
