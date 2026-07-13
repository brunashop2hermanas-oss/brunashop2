import type { Metadata } from "next";
import AdminSidebar from "./AdminSidebar";
import PaymentReminder from "@/components/PaymentReminder";
import LiveNotifications from "@/components/LiveNotifications";

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
    <div className="h-screen bg-gray-50 flex flex-col font-sans print:h-auto print:bg-white overflow-hidden">
      <PaymentReminder />
      <LiveNotifications />
      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
        <AdminSidebar />
      {/* Contenido Principal */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 relative w-full min-w-0 overflow-y-auto overflow-x-hidden print:p-0">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      </div>
    </div>
  );
}
